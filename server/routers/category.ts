import { AccountShareStatus, CategoryType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const categoryRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        type: z.nativeEnum(CategoryType).optional(),
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

      const categories = await ctx.prisma.category.findMany({
        where: {
          accountId: input.accountId,
          ...(input.type && { type: input.type }),
        },
        orderBy: { name: 'asc' },
      });

      return categories;
    }),

  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        name: z.string().min(1),
        type: z.enum(CategoryType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
          accountId_name_type: {
            accountId: input.accountId,
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
          accountId: input.accountId,
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
        type: z.enum(CategoryType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.category.findUnique({
        where: { id: input.id },
        include: {
          account: true,
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: category.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
          accountId_name_type: {
            accountId: category.accountId,
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
              subscriptions: true,
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

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: category.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
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
        category._count.subscriptions > 0
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot delete category with existing transactions or subscriptions',
        });
      }

      await ctx.prisma.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
