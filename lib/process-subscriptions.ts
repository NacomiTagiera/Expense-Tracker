import { TransactionType } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { prisma } from './prisma';
import { calculateNextRunAt } from './subscription-utils';

/**
 * Processes all due subscriptions by creating transactions and updating balances
 * @returns Number of subscriptions processed
 */
export async function processDueSubscriptions(): Promise<number> {
  const now = startOfDay(new Date());

  // Find all active subscriptions that are due for payment
  const dueSubscriptions = await prisma.subscription.findMany({
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
      account: true,
      category: true,
    },
  });

  let processedCount = 0;

  for (const subscription of dueSubscriptions) {
    try {
      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Create the recurring transaction
        await tx.transaction.create({
          data: {
            accountId: subscription.accountId,
            userId: subscription.userId,
            amount: subscription.amount,
            type: subscription.transactionType,
            categoryId: subscription.categoryId,
            description:
              subscription.description || `Recurring: ${subscription.name}`,
            date: subscription.nextRunAt || new Date(),
            subscriptionId: subscription.id,
          },
        });

        // Update account balance based on transaction type
        // INCOME: add to balance, EXPENSE/INVESTMENT: subtract from balance
        const balanceChange =
          subscription.transactionType === TransactionType.INCOME
            ? subscription.amount
            : -subscription.amount;

        await tx.account.update({
          where: { id: subscription.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        // Calculate next run date
        const nextRunAt = calculateNextRunAt(
          subscription.frequency,
          subscription.startDate,
          subscription.nextRunAt, // Use nextRunAt as lastRunAt since it's the payment date
          subscription.cycleDayOfMonth,
          subscription.cycleDayOfWeek,
        );

        // Check if subscription has ended
        const shouldContinue =
          !subscription.endDate || new Date(subscription.endDate) >= nextRunAt;

        // Update subscription: set lastRunAt and nextRunAt
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            lastRunAt: subscription.nextRunAt || new Date(),
            nextRunAt: shouldContinue ? nextRunAt : null,
            isActive: shouldContinue ? subscription.isActive : false,
          },
        });
      });

      processedCount++;
    } catch (error) {
      // Log error but continue processing other subscriptions
      console.error(`Error processing subscription ${subscription.id}:`, error);
    }
  }

  return processedCount;
}
