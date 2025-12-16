import {
  WalletSharePermission,
  WalletShareStatus,
  type CategoryType,
  type PrismaClient,
  type RecurringFrequency,
  type TransactionType,
} from '@prisma/client';
import { hash } from 'bcryptjs';

type UserData = {
  email: string;
  name?: string;
  password?: string;
};

type WalletData = {
  name: string;
  currency?: string;
  balance?: number;
  description?: string;
  userId: string;
};

type CategoryData = {
  name: string;
  type: CategoryType;
  walletId: string;
};

type TransactionData = {
  amount: number;
  type: TransactionType;
  description?: string;
  date?: Date;
  walletId: string;
  userId: string;
  categoryId: string;
  recurringTransactionId?: string;
};

type RecurringTransactionData = {
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  transactionType: TransactionType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  cycleDayOfMonth?: number;
  cycleDayOfWeek?: number;
  walletId: string;
  userId: string;
  categoryId: string;
};

type WalletShareData = {
  walletId: string;
  userId: string;
  permission?: WalletSharePermission;
  status?: WalletShareStatus;
};

export async function userBuilder(prisma: PrismaClient, data: UserData) {
  const hashedPassword = data.password
    ? await hash(data.password, 12)
    : await hash('password123', 12);

  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
  });
}

export async function walletBuilder(prisma: PrismaClient, data: WalletData) {
  return prisma.wallet.create({
    data: {
      name: data.name,
      currency: data.currency ?? 'USD',
      balance: data.balance ?? 0,
      description: data.description,
      userId: data.userId,
    },
  });
}

export async function walletOwnerBuilder(
  prisma: PrismaClient,
  walletId: string,
  userId: string,
) {
  return prisma.walletOwner.create({
    data: {
      walletId,
      userId,
    },
  });
}

export async function walletShareBuilder(
  prisma: PrismaClient,
  data: WalletShareData,
) {
  return prisma.walletShare.create({
    data: {
      walletId: data.walletId,
      userId: data.userId,
      permission: data.permission ?? WalletSharePermission.VIEW,
      status: data.status ?? WalletShareStatus.ACCEPTED,
    },
  });
}

export async function categoryBuilder(
  prisma: PrismaClient,
  data: CategoryData,
) {
  return prisma.category.create({
    data: {
      name: data.name,
      type: data.type,
      walletId: data.walletId,
    },
  });
}

export async function transactionBuilder(
  prisma: PrismaClient,
  data: TransactionData,
) {
  return prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: data.date ?? new Date(),
      walletId: data.walletId,
      userId: data.userId,
      categoryId: data.categoryId,
      recurringTransactionId: data.recurringTransactionId,
    },
  });
}

export async function recurringTransactionBuilder(
  prisma: PrismaClient,
  data: RecurringTransactionData,
) {
  return prisma.recurringTransaction.create({
    data: {
      name: data.name,
      amount: data.amount,
      frequency: data.frequency,
      transactionType: data.transactionType,
      description: data.description,
      startDate: data.startDate ?? new Date(),
      endDate: data.endDate,
      isActive: data.isActive ?? true,
      cycleDayOfMonth: data.cycleDayOfMonth,
      cycleDayOfWeek: data.cycleDayOfWeek,
      walletId: data.walletId,
      userId: data.userId,
      categoryId: data.categoryId,
    },
  });
}
