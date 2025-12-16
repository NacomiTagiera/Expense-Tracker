import type { PrismaClient, WalletSharePermission } from '@prisma/client';

interface WalletAccessResult {
  hasAccess: boolean;
  isOwner: boolean;
}

/**
 * Check if a user has access to a wallet (either as owner or shared user)
 * @param prisma - Prisma client instance
 * @param walletId - The wallet ID to check access for
 * @param userId - The user ID to check access for
 * @param requiredPermission - Optional permission level required (VIEW or EDIT)
 */
export async function checkWalletAccess(
  prisma: PrismaClient,
  walletId: string,
  userId: string,
  requiredPermission?: WalletSharePermission,
): Promise<WalletAccessResult> {
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      OR: [
        { userId },
        {
          shares: {
            some: {
              userId,
              status: 'ACCEPTED',
              ...(requiredPermission && { permission: requiredPermission }),
            },
          },
        },
      ],
    },
    select: {
      userId: true,
    },
  });

  if (!wallet) {
    return { hasAccess: false, isOwner: false };
  }

  return {
    hasAccess: true,
    isOwner: wallet.userId === userId,
  };
}

/**
 * Check if a user is the owner of a wallet
 * @param prisma - Prisma client instance
 * @param walletId - The wallet ID to check ownership for
 * @param userId - The user ID to check ownership for
 */
export async function checkWalletOwnership(
  prisma: PrismaClient,
  walletId: string,
  userId: string,
): Promise<boolean> {
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId,
    },
    select: {
      id: true,
    },
  });

  return wallet !== null;
}

/**
 * Get the permission level a user has for a wallet
 * Returns null if the user has no access
 */
export async function getWalletPermission(
  prisma: PrismaClient,
  walletId: string,
  userId: string,
): Promise<WalletSharePermission | 'OWNER' | null> {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId },
    select: {
      userId: true,
      shares: {
        where: {
          userId,
          status: 'ACCEPTED',
        },
        select: {
          permission: true,
        },
      },
    },
  });

  if (!wallet) {
    return null;
  }

  // Check if user is owner
  if (wallet.userId === userId) {
    return 'OWNER';
  }

  // Check if user has shared access
  const share = wallet.shares[0];
  if (share) {
    return share.permission;
  }

  return null;
}

