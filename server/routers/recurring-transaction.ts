import {
  WalletSharePermission,
  WalletShareStatus,
  RecurringFrequency,
  TransactionType,
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { calculateNextRunAt } from '@/lib/recurring-transaction-utils';
import { protectedProcedure, router } from '../trpc';

export const recurringTransactionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
                },
              },
            },
          ],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const recurringTransactions = await ctx.prisma.recurringTransaction.findMany({
        where: {
          walletId: input.walletId,
          ...(input.cursor && {
            id: {
              lt: input.cursor,
            },
          }),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (recurringTransactions.length > input.limit) {
        const nextItem = recurringTransactions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: recurringTransactions.map((recurringTransaction) => ({
          ...recurringTransaction,
          frequency: recurringTransaction.frequency.toLowerCase(),
          category: recurringTransaction.category.name,
          categoryId: recurringTransaction.categoryId,
        })),
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        name: z.string(),
        amount: z.number().positive(),
        frequency: z.nativeEnum(RecurringFrequency),
        transactionType: z.nativeEnum(TransactionType),
        categoryId: z.string(),
        description: z.string().optional(),
        startDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
                  permission: WalletSharePermission.EDIT,
                },
              },
            },
          ],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const startDate = input.startDate || new Date();
      const nextRunAt = calculateNextRunAt(input.frequency, startDate);

      const recurringTransaction = await ctx.prisma.recurringTransaction.create({
        data: {
          walletId: input.walletId,
          userId: ctx.session.userId,
          name: input.name,
          amount: input.amount,
          frequency: input.frequency,
          transactionType: input.transactionType,
          categoryId: input.categoryId,
          description: input.description,
          startDate,
          nextRunAt,
        },
      });

      return recurringTransaction;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        amount: z.number().positive().optional(),
        frequency: z.nativeEnum(RecurringFrequency).optional(),
        transactionType: z.nativeEnum(TransactionType).optional(),
        categoryId: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const recurringTransaction = await ctx.prisma.recurringTransaction.findUnique({
        where: { id: input.id },
      });

      if (!recurringTransaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recurring transaction not found',
        });
      }

      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: recurringTransaction.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
                  permission: WalletSharePermission.EDIT,
                },
              },
            },
          ],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Recalculate nextRunAt if frequency changed
      const updateData: Parameters<
        typeof ctx.prisma.recurringTransaction.update
      >[0]['data'] = {
        name: input.name,
        amount: input.amount,
        frequency: input.frequency,
        transactionType: input.transactionType,
        categoryId: input.categoryId,
        description: input.description,
        isActive: input.isActive,
        endDate: input.endDate,
      };

      if (input.frequency) {
        updateData.nextRunAt = calculateNextRunAt(
          input.frequency,
          recurringTransaction.startDate,
          recurringTransaction.lastRunAt,
          recurringTransaction.cycleDayOfMonth,
          recurringTransaction.cycleDayOfWeek,
        );
      }

      const updated = await ctx.prisma.recurringTransaction.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recurringTransaction = await ctx.prisma.recurringTransaction.findUnique({
        where: { id: input.id },
      });

      if (!recurringTransaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recurring transaction not found',
        });
      }

      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: recurringTransaction.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
                  permission: WalletSharePermission.EDIT,
                },
              },
            },
          ],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      await ctx.prisma.recurringTransaction.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

