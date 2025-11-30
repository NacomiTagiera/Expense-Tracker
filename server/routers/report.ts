/** biome-ignore-all lint/style/noNonNullAssertion: <this is a valid use case> */
import { AccountShareStatus, TransactionType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const reportRouter = router({
  summary: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId: input.accountId,
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
        accountId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        type: z.nativeEnum(TransactionType).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId: input.accountId,
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
        accountId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId: input.accountId,
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
          const userId = t.user.id;

          if (!acc[userId]) {
            acc[userId] = {
              userId,
              name: userName,
              email: t.user.email,
              income: 0,
              expense: 0,
            };
          }

          if (t.type === TransactionType.INCOME) {
            acc[userId].income += Number(t.amount);
          } else {
            acc[userId].expense += Number(t.amount);
          }

          return acc;
        },
        {} as Record<
          string,
          {
            userId: string;
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

  bySubscription: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId: input.accountId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
          subscriptionId: {
            not: null,
          },
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const subscriptionData = transactions.reduce(
        (acc, t) => {
          if (!t.subscription) return acc;

          const subscriptionId = t.subscription.id;
          const subscriptionName = t.subscription.name;

          if (!acc[subscriptionId]) {
            acc[subscriptionId] = {
              subscriptionId,
              name: subscriptionName,
              amount: 0,
              transactionCount: 0,
            };
          }

          acc[subscriptionId].amount += Number(t.amount);
          acc[subscriptionId].transactionCount += 1;

          return acc;
        },
        {} as Record<
          string,
          {
            subscriptionId: string;
            name: string;
            amount: number;
            transactionCount: number;
          }
        >,
      );

      return Object.values(subscriptionData).sort(
        (a, b) => b.amount - a.amount,
      );
    }),

  trends: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId: input.accountId,
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
