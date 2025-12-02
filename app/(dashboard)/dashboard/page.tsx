import { redirect } from 'next/navigation';
import { AccountList } from '@/components/accounts/account-list';
import { CreateAccountDialog } from '@/components/accounts/create-account-dialog';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Wallets</h1>
            <p className="text-muted-foreground">
              Manage your financial wallets
            </p>
          </div>
          <CreateAccountDialog />
        </div>
        <AccountList />
      </main>
    </div>
  );
}
