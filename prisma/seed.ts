import {
  WalletSharePermission,
  WalletShareStatus,
  CategoryType,
  PrismaClient,
  RecurringFrequency,
  TransactionType,
} from '@prisma/client';
import { startOfDay, subDays, subWeeks } from 'date-fns';
import {
  walletBuilder,
  walletOwnerBuilder,
  walletShareBuilder,
  categoryBuilder,
  recurringTransactionBuilder,
  transactionBuilder,
  userBuilder,
} from '../lib/builders';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await prisma.transaction.deleteMany();
  await prisma.recurringTransaction.deleteMany();
  await prisma.walletShare.deleteMany();
  await prisma.walletOwner.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const accountOwner = await userBuilder(prisma, {
    email: 'anne.doe@example.com',
    name: 'Anne Doe',
    password: 'password123',
  });

  const guestUser = await userBuilder(prisma, {
    email: 'john.smith@example.com',
    name: 'John Smith',
    password: 'password123',
  });

  const wallet = await walletBuilder(prisma, {
    name: 'Main Account',
    currency: 'USD',
    balance: 5000,
    description: 'Primary checking account',
    userId: accountOwner.id,
  });

  await walletOwnerBuilder(prisma, wallet.id, accountOwner.id);

  await walletShareBuilder(prisma, {
    walletId: wallet.id,
    userId: guestUser.id,
    permission: WalletSharePermission.EDIT,
    status: WalletShareStatus.ACCEPTED,
  });

  const incomeCategory = await categoryBuilder(prisma, {
    name: 'Salary',
    type: CategoryType.INCOME,
    walletId: wallet.id,
  });

  const expenseCategory1 = await categoryBuilder(prisma, {
    name: 'Groceries',
    type: CategoryType.EXPENSE,
    walletId: wallet.id,
  });

  const expenseCategory2 = await categoryBuilder(prisma, {
    name: 'Restaurants',
    type: CategoryType.EXPENSE,
    walletId: wallet.id,
  });

  const expenseCategory3 = await categoryBuilder(prisma, {
    name: 'Entertainment',
    type: CategoryType.EXPENSE,
    walletId: wallet.id,
  });

  const subscriptionCategory = await categoryBuilder(prisma, {
    name: 'Streaming Services',
    type: CategoryType.EXPENSE,
    walletId: wallet.id,
  });

  await transactionBuilder(prisma, {
    amount: 5000,
    type: TransactionType.INCOME,
    description: 'Monthly salary',
    walletId: wallet.id,
    userId: accountOwner.id,
    categoryId: incomeCategory.id,
    date: subWeeks(startOfDay(new Date()), 2),
  });

  await transactionBuilder(prisma, {
    amount: 150.75,
    type: TransactionType.EXPENSE,
    description: 'Weekly groceries',
    walletId: wallet.id,
    userId: accountOwner.id,
    categoryId: expenseCategory1.id,
    date: subWeeks(startOfDay(new Date()), 1),
  });

  await transactionBuilder(prisma, {
    amount: 299.99,
    type: TransactionType.EXPENSE,
    description: 'Laptop purchase',
    walletId: wallet.id,
    userId: accountOwner.id,
    categoryId: expenseCategory3.id,
    date: subDays(startOfDay(new Date()), 3),
  });

  await transactionBuilder(prisma, {
    amount: 45.5,
    type: TransactionType.EXPENSE,
    description: 'Dinner',
    walletId: wallet.id,
    userId: guestUser.id,
    categoryId: expenseCategory2.id,
    date: startOfDay(new Date()),
  });

  await recurringTransactionBuilder(prisma, {
    name: 'Netflix',
    amount: 10,
    frequency: RecurringFrequency.MONTHLY,
    transactionType: TransactionType.EXPENSE,
    walletId: wallet.id,
    userId: accountOwner.id,
    categoryId: subscriptionCategory.id,
    cycleDayOfMonth: 21,
    startDate: subDays(startOfDay(new Date()), 10),
    isActive: true,
  });

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
