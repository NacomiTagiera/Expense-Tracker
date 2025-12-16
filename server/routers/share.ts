import { WalletSharePermission, WalletShareStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const shareRouter = router({
  invite: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        email: z.string().email(),
        permission: z
          .nativeEnum(WalletSharePermission)
          .default(WalletSharePermission.VIEW),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wallet = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.walletId,
          userId: ctx.session.userId,
        },
      });

      if (!wallet) {
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

      const existingShare = await ctx.prisma.walletShare.findUnique({
        where: {
          walletId_userId: {
            walletId: input.walletId,
            userId: invitedUser.id,
          },
        },
      });

      if (existingShare) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already has access to this wallet',
        });
      }

      const share = await ctx.prisma.walletShare.create({
        data: {
          walletId: input.walletId,
          userId: invitedUser.id,
          permission: input.permission,
        },
      });

      return share;
    }),

  listInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await ctx.prisma.walletShare.findMany({
      where: {
        userId: ctx.session.userId,
        status: WalletShareStatus.PENDING,
      },
      include: {
        wallet: {
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
      const share = await ctx.prisma.walletShare.findFirst({
        where: {
          id: input.shareId,
          userId: ctx.session.userId,
          status: WalletShareStatus.PENDING,
        },
      });

      if (!share) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      if (input.accept) {
        await ctx.prisma.walletShare.update({
          where: { id: input.shareId },
          data: { status: WalletShareStatus.ACCEPTED },
        });
      } else {
        await ctx.prisma.walletShare.delete({
          where: { id: input.shareId },
        });
      }

      return { success: true };
    }),

  removeAccess: protectedProcedure
    .input(
      z.object({
        walletId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wallet = await ctx.prisma.wallet.findFirst({
        where: {
          id: input.walletId,
          userId: ctx.session.userId,
        },
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only wallet owners can remove access',
        });
      }

      await ctx.prisma.walletShare.delete({
        where: {
          walletId_userId: {
            walletId: input.walletId,
            userId: input.userId,
          },
        },
      });

      return { success: true };
    }),
});
