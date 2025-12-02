import { AccountSharePermission, AccountShareStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const shareRouter = router({
  invite: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        email: z.string().email(),
        permission: z
          .nativeEnum(AccountSharePermission)
          .default(AccountSharePermission.VIEW),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only wallet owners can invite users',
        });
      }

      const invitedUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!invitedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (invitedUser.id === ctx.session.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot invite yourself',
        });
      }

      const existingShare = await ctx.prisma.accountShare.findUnique({
        where: {
          accountId_userId: {
            accountId: input.accountId,
            userId: invitedUser.id,
          },
        },
      });

      if (existingShare) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already has access to this account',
        });
      }

      const share = await ctx.prisma.accountShare.create({
        data: {
          accountId: input.accountId,
          userId: invitedUser.id,
          permission: input.permission,
        },
      });

      return share;
    }),

  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.prisma.accountShare.findMany({
      where: {
        userId: ctx.session.userId,
        status: AccountShareStatus.PENDING,
      },
      include: {
        account: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return invitations;
  }),

  respondToInvitation: protectedProcedure
    .input(
      z.object({
        shareId: z.string(),
        accept: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const share = await ctx.prisma.accountShare.findFirst({
        where: {
          id: input.shareId,
          userId: ctx.session.userId,
          status: AccountShareStatus.PENDING,
        },
      });

      if (!share) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      if (input.accept) {
        await ctx.prisma.accountShare.update({
          where: { id: input.shareId },
          data: { status: AccountShareStatus.ACCEPTED },
        });
      } else {
        await ctx.prisma.accountShare.delete({
          where: { id: input.shareId },
        });
      }

      return { success: true };
    }),

  removeAccess: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.account.findFirst({
        where: {
          id: input.accountId,
          userId: ctx.session.userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only wallet owners can remove access',
        });
      }

      await ctx.prisma.accountShare.delete({
        where: {
          accountId_userId: {
            accountId: input.accountId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),
});
