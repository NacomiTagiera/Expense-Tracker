'use client';

import { Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc-client';
import { WalletCard } from './wallet-card';

export function WalletList() {
  const { data: wallets, isLoading } = trpc.wallet.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No wallets yet. Create your first wallet to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {wallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </div>
  );
}

