import { WalletShareStatus, CategoryType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const walletRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await ctx.prisma.wallet.findMany({
      where: {
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
        shares: {
          where: { userId: ctx.session.userId },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wallets.map((wallet) => ({
      ...wallet,
      balance: Number(wallet.balance),
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
      const ownedWalletsCount = await ctx.prisma.wallet.count({
        where: { userId: ctx.session.userId },
      });

      if (ownedWalletsCount >= 3) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum of 3 wallets allowed per user',
        });
      }

      const wallet = await ctx.prisma.wallet.create({
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

      return wallet;
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
      const wallet = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.userId,
        },
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or access denied',
        });
      }

      const updated = await ctx.prisma.wallet.update({
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
      const wallet = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.userId,
        },
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found or access denied',
        });
      }

      await ctx.prisma.wallet.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const wallet = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.id,
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

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found',
        });
      }

      const isOwner = wallet.userId === ctx.session.userId;
      const currentUserShare = wallet.shares.find(
        (share) => share.userId === ctx.session.userId,
      );

      return {
        ...wallet,
        balance: Number(wallet.balance),
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

