/** biome-ignore-all lint/style/noNonNullAssertion: <this is a valid use case> */
import { WalletShareStatus, TransactionType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const reportRouter = router({
  summary: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
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

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: input.walletId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          category: true,
        },
      });

      const income = transactions
        .filter((t) => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expenses = transactions
        .filter((t) => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const categoryBreakdown = transactions.reduce(
        (acc, t) => {
          const categoryName = t.category.name;
          if (!acc[categoryName]) {
            acc[categoryName] = { income: 0, expense: 0 };
          }
          if (t.type === TransactionType.INCOME) {
            acc[categoryName].income += Number(t.amount);
          } else {
            acc[categoryName].expense += Number(t.amount);
          }
          return acc;
        },
        {} as Record<string, { income: number; expense: number }>,
      );

      return {
        income,
        expenses,
        net: income - expenses,
        categoryBreakdown,
        transactionCount: transactions.length,
      };
    }),

  byCategory: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        type: z.nativeEnum(TransactionType).optional(),
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

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: input.walletId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
          ...(input.type && { type: input.type }),
        },
        include: {
          category: true,
        },
      });

      const categoryData = transactions.reduce(
        (acc, t) => {
          const categoryName = t.category.name;
          if (!acc[categoryName]) {
            acc[categoryName] = 0;
          }
          acc[categoryName] += Number(t.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      return Object.entries(categoryData)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
    }),

  byUser: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
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
        include: {
          owners: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: input.walletId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const userData = transactions.reduce(
        (acc, t) => {
          const userName = t.user.name || t.user.email.split('@')[0];
          const oderedUserId = t.user.id;

          if (!acc[oderedUserId]) {
            acc[oderedUserId] = {
              oderedUserId,
              name: userName,
              email: t.user.email,
              income: 0,
              expense: 0,
            };
          }

          if (t.type === TransactionType.INCOME) {
            acc[oderedUserId].income += Number(t.amount);
          } else {
            acc[oderedUserId].expense += Number(t.amount);
          }

          return acc;
        },
        {} as Record<
          string,
          {
            oderedUserId: string;
            name: string;
            email: string;
            income: number;
            expense: number;
          }
        >,
      );

      return Object.values(userData)
        .map((user) => ({
          ...user,
          total: user.income + user.expense,
        }))
        .sort((a, b) => b.total - a.total);
    }),

  byRecurringTransaction: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
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

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: input.walletId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
          recurringTransactionId: {
            not: null,
          },
        },
        include: {
          recurringTransaction: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const recurringTransactionData = transactions.reduce(
        (acc, t) => {
          if (!t.recurringTransaction) return acc;

          const recurringTransactionId = t.recurringTransaction.id;
          const recurringTransactionName = t.recurringTransaction.name;

          if (!acc[recurringTransactionId]) {
            acc[recurringTransactionId] = {
              recurringTransactionId,
              name: recurringTransactionName,
              amount: 0,
              transactionCount: 0,
            };
          }

          acc[recurringTransactionId].amount += Number(t.amount);
          acc[recurringTransactionId].transactionCount += 1;

          return acc;
        },
        {} as Record<
          string,
          {
            recurringTransactionId: string;
            name: string;
            amount: number;
            transactionCount: number;
          }
        >,
      );

      return Object.values(recurringTransactionData).sort(
        (a, b) => b.amount - a.amount,
      );
    }),

  trends: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
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

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: input.walletId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
      });

      const dateMap = new Map<string, { income: number; expense: number }>();

      transactions.forEach((t) => {
        const date = new Date(t.date);
        let key: string;

        if (input.interval === 'daily') {
          key = date.toISOString().split('T')[0]!;
        } else if (input.interval === 'weekly') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `W${weekStart.toISOString().split('T')[0]!}`;
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!dateMap.has(key)) {
          dateMap.set(key, { income: 0, expense: 0 });
        }

        const entry = dateMap.get(key)!;
        if (t.type === TransactionType.INCOME) {
          entry.income += Number(t.amount);
        } else {
          entry.expense += Number(t.amount);
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          income: data.income,
          expense: data.expense,
          net: data.income - data.expense,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }),
});
