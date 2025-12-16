'use client';

import { WalletShareStatus } from '@prisma/client';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ManageSharesDialog } from '@/components/sharing/manage-shares-dialog';
import { ShareWalletDialog } from '@/components/sharing/share-wallet-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { trpc } from '@/lib/trpc-client';

export function WalletDetails({ walletId }: { walletId: string }) {
  const router = useRouter();
  const { data: wallet, isLoading } = trpc.wallet.getById.useQuery({
    id: walletId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Wallet not found</p>
      </div>
    );
  }

  const isOwner = wallet.isOwner ?? false;
  const userShare = wallet.currentUserShare;
  const isShared =
    !isOwner && userShare?.status === WalletShareStatus.ACCEPTED;

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
                {wallet.name}
                {isShared && userShare && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({userShare.permission})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {wallet.description || 'No description'}
              </CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <ShareWalletDialog walletId={walletId} />
                <ManageSharesDialog walletId={walletId} wallet={wallet} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold" data-testid="wallet-balance">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: wallet.currency,
                }).format(Number(wallet.balance))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-xl font-semibold">{wallet.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Total Transactions
              </p>
              <p className="text-xl font-semibold">
                {wallet._count.transactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

