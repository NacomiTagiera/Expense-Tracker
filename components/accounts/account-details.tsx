'use client';

import { AccountShareStatus } from '@prisma/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ManageSharesDialog } from '@/components/sharing/manage-shares-dialog';
import { ShareAccountDialog } from '@/components/sharing/share-account-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { trpc } from '@/lib/trpc-client';

export function AccountDetails({ accountId }: { accountId: string }) {
  const router = useRouter();
  const { data: account, isLoading } = trpc.account.getById.useQuery({
    id: accountId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Account not found</p>
      </div>
    );
  }

  const isOwner = account.isOwner ?? false;
  const userShare = account.currentUserShare;
  const isShared =
    !isOwner && userShare?.status === AccountShareStatus.ACCEPTED;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Wallets
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {account.name}
                {isShared && userShare && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({userShare.permission})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {account.description || 'No description'}
              </CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <ShareAccountDialog accountId={accountId} />
                <ManageSharesDialog accountId={accountId} account={account} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: account.currency,
                }).format(Number(account.balance))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-xl font-semibold">{account.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Transactions
              </p>
              <p className="text-xl font-semibold">
                {account._count.transactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
