import { router } from '../trpc';
import { authRouter } from './auth';
import { categoryRouter } from './category';
import { recurringTransactionRouter } from './recurring-transaction';
import { reportRouter } from './report';
import { shareRouter } from './share';
import { transactionRouter } from './transaction';
import { walletRouter } from './wallet';

export const appRouter = router({
  auth: authRouter,
  wallet: walletRouter,
  transaction: transactionRouter,
  recurringTransaction: recurringTransactionRouter,
  share: shareRouter,
  report: reportRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
