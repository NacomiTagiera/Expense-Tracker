import { WalletShareStatus, CategoryType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const categoryRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        type: z.nativeEnum(CategoryType).optional(),
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

      const categories = await ctx.prisma.category.findMany({
        where: {
          walletId: input.walletId,
          ...(input.type && { type: input.type }),
        },
        orderBy: { name: 'asc' },
      });

      return categories;
    }),

  create: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        name: z.string().min(1),
        type: z.nativeEnum(CategoryType),
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

      const existingCategory = await ctx.prisma.category.findUnique({
        where: {
          walletId_name_type: {
            walletId: input.walletId,
            name: input.name,
            type: input.type,
          },
        },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Category already exists',
        });
      }

      const category = await ctx.prisma.category.create({
        data: {
          walletId: input.walletId,
          name: input.name,
          type: input.type,
        },
      });

      return category;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        type: z.nativeEnum(CategoryType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: {
          wallet: true,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: category.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
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

      const existingCategory = await ctx.prisma.category.findUnique({
        where: {
          walletId_name_type: {
            walletId: category.walletId,
            name: input.name,
            type: input.type,
          },
        },
      });

      if (existingCategory && existingCategory.id !== input.id) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Category with this name already exists',
        });
      }

      const updated = await ctx.prisma.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          type: input.type,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              transactions: true,
              recurringTransactions: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      const hasAccess = await ctx.prisma.wallet.findFirst({
        where: {
          id: category.walletId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: WalletShareStatus.ACCEPTED,
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

      if (
        category._count.transactions > 0 ||
        category._count.recurringTransactions > 0
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot delete category with existing transactions or recurring transactions',
        });
      }

      await ctx.prisma.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
