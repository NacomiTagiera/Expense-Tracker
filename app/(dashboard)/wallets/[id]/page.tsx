import { redirect } from 'next/navigation';
import { CategoryList } from '@/components/categories/category-list';
import { CreateCategoryDialog } from '@/components/categories/create-category-dialog';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { CreateRecurringTransactionDialog } from '@/components/recurring-transactions/create-recurring-transaction-dialog';
import { RecurringTransactionList } from '@/components/recurring-transactions/recurring-transaction-list';
import { ReportsDashboard } from '@/components/reports/reports-dashboard';
import { CreateTransactionDialog } from '@/components/transactions/create-transaction-dialog';
import { TransactionList } from '@/components/transactions/transaction-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletDetails } from '@/components/wallets/wallet-details';
import { getSession } from '@/lib/auth';

interface WalletPageProps {
  params: Promise<{ id: string }>;
}

export default async function WalletPage({ params }: WalletPageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <WalletDetails walletId={id} />
        <div className="mt-8">
          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Transactions
                  </h2>
                  <p className="text-muted-foreground">
                    View and manage your transactions
                  </p>
                </div>
                <CreateTransactionDialog walletId={id} />
              </div>
              <TransactionList walletId={id} />
            </TabsContent>

            <TabsContent value="recurring" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Recurring Transactions
                  </h2>
                  <p className="text-muted-foreground">
                    Manage automatic recurring income and expenses
                  </p>
                </div>
                <CreateRecurringTransactionDialog walletId={id} />
              </div>
              <RecurringTransactionList walletId={id} />
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Categories
                  </h2>
                  <p className="text-muted-foreground">
                    Manage your transaction categories
                  </p>
                </div>
                <CreateCategoryDialog walletId={id} />
              </div>
              <CategoryList walletId={id} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Financial Reports
                </h2>
                <p className="text-muted-foreground">
                  Analyze your income and expenses
                </p>
              </div>
              <ReportsDashboard walletId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

