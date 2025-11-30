import { TransactionType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const transactionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        type: z.nativeEnum(TransactionType).optional(),
        categoryId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
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
                  status: 'ACCEPTED',
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

      const where = {
        accountId: input.accountId,
        ...(input.type && { type: input.type }),
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.startDate && { date: { gte: input.startDate } }),
        ...(input.endDate && { date: { lte: input.endDate } }),
        ...(input.cursor && {
          id: {
            lt: input.cursor,
          },
        }),
      };

      const transactions = await ctx.prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
            },
          },
          subscription: {
            select: {
              id: true,
              name: true,
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
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        take: input.limit + 1,
      });

      let nextCursor: string | undefined;
      if (transactions.length > input.limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: transactions.map((transaction) => ({
          ...transaction,
          category: transaction.category?.name,
          categoryId: transaction.categoryId,
          subscription: transaction.subscription
            ? {
                id: transaction.subscription.id,
                name: transaction.subscription.name,
              }
            : null,
          user: transaction.user
            ? {
                id: transaction.user.id,
                name: transaction.user.name,
                email: transaction.user.email,
              }
            : null,
        })),
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        amount: z.number().positive(),
        type: z.nativeEnum(TransactionType),
        categoryId: z.string(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: 'ACCEPTED',
                  permission: 'EDIT',
                },
              },
            },
          ],
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const transaction = await ctx.prisma.transaction.create({
        data: {
          accountId: input.accountId,
          userId: ctx.session.userId,
          amount: input.amount,
          type: input.type,
          categoryId: input.categoryId,
          description: input.description,
          date: input.date || new Date(),
        },
      });

      const balanceChange =
        input.type === 'INCOME' ? input.amount : -input.amount;

      await ctx.prisma.account.update({
        where: { id: input.accountId },
        data: { balance: { increment: balanceChange } },
      });

      return transaction;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.number().positive().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        categoryId: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findUnique({
        where: { id: input.id },
        include: { account: true },
      });

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: transaction.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: 'ACCEPTED',
                  permission: 'EDIT',
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

      const oldBalanceChange =
        transaction.type === 'INCOME'
          ? -Number(transaction.amount)
          : Number(transaction.amount);

      await ctx.prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: oldBalanceChange } },
      });

      const updated = await ctx.prisma.transaction.update({
        where: { id: input.id },
        data: {
          amount: input.amount,
          type: input.type,
          categoryId: input.categoryId,
          description: input.description,
          date: input.date,
        },
      });

      const newBalanceChange =
        (input.type || transaction.type) === 'INCOME'
          ? input.amount || Number(transaction.amount)
          : -(input.amount || Number(transaction.amount));

      await ctx.prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: newBalanceChange } },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findUnique({
        where: { id: input.id },
      });

      if (!transaction) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        });
      }

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: transaction.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: 'ACCEPTED',
                  permission: 'EDIT',
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

      const balanceChange =
        transaction.type === 'INCOME'
          ? -Number(transaction.amount)
          : Number(transaction.amount);

      await ctx.prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });

      await ctx.prisma.transaction.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
