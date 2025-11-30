import { router } from '../trpc';
import { accountRouter } from './account';
import { authRouter } from './auth';
import { categoryRouter } from './category';
import { reportRouter } from './report';
import { shareRouter } from './share';
import { subscriptionRouter } from './subscription';
import { transactionRouter } from './transaction';

export const appRouter = router({
  auth: authRouter,
  account: accountRouter,
  transaction: transactionRouter,
  subscription: subscriptionRouter,
  share: shareRouter,
  report: reportRouter,
  category: categoryRouter,
});

export type AppRouter = typeof appRouter;
