import { AccountShareStatus, CategoryType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const accountRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.account.findMany({
      where: {
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
        shares: {
          where: { userId: ctx.session.userId },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => ({
      ...account,
      balance: Number(account.balance),
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        currency: z.string().default('USD'),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ownedAccountsCount = await ctx.prisma.account.count({
        where: { userId: ctx.session.userId },
      });

      if (ownedAccountsCount >= 3) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum of 3 accounts allowed per user',
        });
      }

      const account = await ctx.prisma.account.create({
        data: {
          name: input.name,
          currency: input.currency,
          description: input.description,
          userId: ctx.session.userId,
          owners: {
            create: {
              userId: ctx.session.userId,
            },
          },
          categories: {
            createMany: {
              data: [
                { name: 'Groceries', type: CategoryType.EXPENSE },
                { name: 'Rent / Mortgage', type: CategoryType.EXPENSE },
                { name: 'Utilities', type: CategoryType.EXPENSE },
                { name: 'Transportation', type: CategoryType.EXPENSE },
                { name: 'Dining Out', type: CategoryType.EXPENSE },
                { name: 'Healthcare', type: CategoryType.EXPENSE },
                { name: 'Entertainment', type: CategoryType.EXPENSE },
                { name: 'Clothing & Accessories', type: CategoryType.EXPENSE },
                { name: 'Household Supplies', type: CategoryType.EXPENSE },
                { name: 'Insurance', type: CategoryType.EXPENSE },
                { name: 'Education', type: CategoryType.EXPENSE },
                { name: 'Travel', type: CategoryType.EXPENSE },
                { name: 'Debt Payments', type: CategoryType.EXPENSE },

                { name: 'Salary', type: CategoryType.INCOME },
                { name: 'Freelance Work', type: CategoryType.INCOME },
                { name: 'Business Income', type: CategoryType.INCOME },
                { name: 'Investments', type: CategoryType.INCOME },
                { name: 'Rental Income', type: CategoryType.INCOME },
                { name: 'Gifts', type: CategoryType.INCOME },
                { name: 'Refunds & Reimbursements', type: CategoryType.INCOME },
              ],
            },
          },
        },
      });

      return account;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        currency: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found or access denied',
        });
      }

      const updated = await ctx.prisma.account.update({
        where: { id: input.id },
        data: {
          name: input.name,
          currency: input.currency,
          description: input.description,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found or access denied',
        });
      }

      await ctx.prisma.account.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.id,
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
          shares: {
            select: {
              id: true,
              userId: true,
              permission: true,
              status: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: { transactions: true },
          },
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found',
        });
      }

      const isOwner = account.userId === ctx.session.userId;
      const currentUserShare = account.shares.find(
        (share) => share.userId === ctx.session.userId,
      );

      return {
        ...account,
        balance: Number(account.balance),
        isOwner,
        currentUserShare: currentUserShare
          ? {
              permission: currentUserShare.permission,
              status: currentUserShare.status,
            }
          : null,
      };
    }),
});
