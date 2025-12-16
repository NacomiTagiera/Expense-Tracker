'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc-client';
import { RecurringTransactionCard } from './recurring-transaction-card';

interface Props {
  walletId: string;
}

export function RecurringTransactionList({ walletId }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.recurringTransaction.list.useInfiniteQuery(
      {
        walletId,
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const recurringTransactions = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (recurringTransactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No recurring transactions yet. Add your first recurring transaction to track recurring
          income or expenses.
        </p>
      </div>
    );
  }

  const activeRecurringTransactions = recurringTransactions.filter((rt) => rt.isActive);
  const inactiveRecurringTransactions = recurringTransactions.filter((rt) => !rt.isActive);

  return (
    <div className="space-y-8">
      {activeRecurringTransactions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Recurring Transactions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeRecurringTransactions.map((recurringTransaction) => (
              <RecurringTransactionCard
                key={recurringTransaction.id}
                recurringTransaction={{
                  ...recurringTransaction,
                  amount: Number(recurringTransaction.amount),
                  walletId,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {inactiveRecurringTransactions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Inactive Recurring Transactions
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {inactiveRecurringTransactions.map((recurringTransaction) => (
              <RecurringTransactionCard
                key={recurringTransaction.id}
                recurringTransaction={{
                  ...recurringTransaction,
                  amount: Number(recurringTransaction.amount),
                  walletId,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

