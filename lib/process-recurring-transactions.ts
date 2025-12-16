import { TransactionType } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { prisma } from './prisma';
import { calculateNextRunAt } from './recurring-transaction-utils';

export async function processDueRecurringTransactions(): Promise<number> {
  const now = startOfDay(new Date());

  const dueRecurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      startDate: {
        lte: now,
      },
      nextRunAt: {
        lte: now,
        not: null,
      },
      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gte: now,
          },
        },
      ],
    },
    include: {
      wallet: true,
      category: true,
    },
  });

  let processedCount = 0;

  for (const recurringTransaction of dueRecurringTransactions) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            walletId: recurringTransaction.walletId,
            userId: recurringTransaction.userId,
            amount: recurringTransaction.amount,
            type: recurringTransaction.transactionType,
            categoryId: recurringTransaction.categoryId,
            description:
              recurringTransaction.description || `Recurring: ${recurringTransaction.name}`,
            date: recurringTransaction.nextRunAt || new Date(),
            recurringTransactionId: recurringTransaction.id,
          },
        });

        const balanceChange =
          recurringTransaction.transactionType === TransactionType.INCOME
            ? recurringTransaction.amount
            : -recurringTransaction.amount;

        await tx.wallet.update({
          where: { id: recurringTransaction.walletId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        const nextRunAt = calculateNextRunAt(
          recurringTransaction.frequency,
          recurringTransaction.startDate,
          recurringTransaction.nextRunAt,
          recurringTransaction.cycleDayOfMonth,
          recurringTransaction.cycleDayOfWeek,
        );

        const shouldContinue =
          !recurringTransaction.endDate || new Date(recurringTransaction.endDate) >= nextRunAt;

        await tx.recurringTransaction.update({
          where: { id: recurringTransaction.id },
          data: {
            lastRunAt: recurringTransaction.nextRunAt || new Date(),
            nextRunAt: shouldContinue ? nextRunAt : null,
            isActive: shouldContinue ? recurringTransaction.isActive : false,
          },
        });
      });

      processedCount++;
    } catch (error) {
      console.error(`Error processing recurring transaction ${recurringTransaction.id}:`, error);
    }
  }

  return processedCount;
}

