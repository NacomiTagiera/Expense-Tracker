import {
  AccountSharePermission,
  AccountShareStatus,
  SubscriptionFrequency,
  TransactionType,
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { calculateNextRunAt } from '@/lib/subscription-utils';
import { protectedProcedure, router } from '../trpc';

export const subscriptionRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
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

      const subscriptions = await ctx.prisma.subscription.findMany({
        where: {
          accountId: input.accountId,
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
      if (subscriptions.length > input.limit) {
        const nextItem = subscriptions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: subscriptions.map((subscription) => ({
          ...subscription,
          frequency: subscription.frequency.toLowerCase(),
          category: subscription.category.name,
          categoryId: subscription.categoryId,
        })),
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        name: z.string(),
        amount: z.number().positive(),
        frequency: z.nativeEnum(SubscriptionFrequency),
        transactionType: z.nativeEnum(TransactionType),
        categoryId: z.string(),
        description: z.string().optional(),
        startDate: z.date().optional(),
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
                  permission: AccountSharePermission.EDIT,
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

      const subscription = await ctx.prisma.subscription.create({
        data: {
          accountId: input.accountId,
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

      return subscription;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        amount: z.number().positive().optional(),
        frequency: z.nativeEnum(SubscriptionFrequency).optional(),
        transactionType: z.nativeEnum(TransactionType).optional(),
        categoryId: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        });
      }

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: subscription.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
                  permission: AccountSharePermission.EDIT,
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
        typeof ctx.prisma.subscription.update
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
          subscription.startDate,
          subscription.lastRunAt,
          subscription.cycleDayOfMonth,
          subscription.cycleDayOfWeek,
        );
      }

      const updated = await ctx.prisma.subscription.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: { id: input.id },
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        });
      }

      const hasAccess = await ctx.prisma.account.findFirst({
        where: {
          id: subscription.accountId,
          OR: [
            { userId: ctx.session.userId },
            {
              shares: {
                some: {
                  userId: ctx.session.userId,
                  status: AccountShareStatus.ACCEPTED,
                  permission: AccountSharePermission.EDIT,
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

      await ctx.prisma.subscription.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
