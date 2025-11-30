import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from '@/lib/auth';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      const hashedPassword = await hashPassword(input.password);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
        },
      });

      await createSession(
        { userId: user.id, email: user.email },
        { resHeaders: ctx.resHeaders },
      );

      return { success: true, userId: user.id };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.debug('[auth.login] resHeaders present', Boolean(ctx.resHeaders));

      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValid = await verifyPassword(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const token = await createSession(
        { userId: user.id, email: user.email },
        { resHeaders: ctx.resHeaders },
      );

      console.debug('[auth.login] session token issued', Boolean(token));

      return { success: true, userId: user.id };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteSession({ resHeaders: ctx.resHeaders });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),
});
