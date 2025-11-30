import {
  AccountSharePermission,
  AccountShareStatus,
  type CategoryType,
  type PrismaClient,
  type SubscriptionFrequency,
  type TransactionType,
} from '@prisma/client';
import { hash } from 'bcryptjs';

type UserData = {
  email: string;
  name?: string;
  password?: string;
};

type AccountData = {
  name: string;
  currency?: string;
  balance?: number;
  description?: string;
  userId: string;
};

type CategoryData = {
  name: string;
  type: CategoryType;
  accountId: string;
};

type TransactionData = {
  amount: number;
  type: TransactionType;
  description?: string;
  date?: Date;
  accountId: string;
  userId: string;
  categoryId: string;
  subscriptionId?: string;
};

type SubscriptionData = {
  name: string;
  amount: number;
  frequency: SubscriptionFrequency;
  transactionType: TransactionType;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  cycleDayOfMonth?: number;
  cycleDayOfWeek?: number;
  accountId: string;
  userId: string;
  categoryId: string;
};

type AccountShareData = {
  accountId: string;
  userId: string;
  permission?: AccountSharePermission;
  status?: AccountShareStatus;
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

export async function accountBuilder(prisma: PrismaClient, data: AccountData) {
  return prisma.account.create({
    data: {
      name: data.name,
      currency: data.currency ?? 'USD',
      balance: data.balance ?? 0,
      description: data.description,
      userId: data.userId,
    },
  });
}

export async function accountOwnerBuilder(
  prisma: PrismaClient,
  accountId: string,
  userId: string,
) {
  return prisma.accountOwner.create({
    data: {
      accountId,
      userId,
    },
  });
}

export async function accountShareBuilder(
  prisma: PrismaClient,
  data: AccountShareData,
) {
  return prisma.accountShare.create({
    data: {
      accountId: data.accountId,
      userId: data.userId,
      permission: data.permission ?? AccountSharePermission.VIEW,
      status: data.status ?? AccountShareStatus.ACCEPTED,
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
      accountId: data.accountId,
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
      accountId: data.accountId,
      userId: data.userId,
      categoryId: data.categoryId,
      subscriptionId: data.subscriptionId,
    },
  });
}

export async function subscriptionBuilder(
  prisma: PrismaClient,
  data: SubscriptionData,
) {
  return prisma.subscription.create({
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
      accountId: data.accountId,
      userId: data.userId,
      categoryId: data.categoryId,
    },
  });
}
