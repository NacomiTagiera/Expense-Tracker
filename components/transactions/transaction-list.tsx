'use client';

import type { TransactionType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc-client';
import { TransactionCard } from './transaction-card';
import { TransactionFilters } from './transaction-filters';

interface Props {
  accountId: string;
}

export function TransactionList({ accountId }: Props) {
  const [filters, setFilters] = useState<{
    type?: TransactionType;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.transaction.list.useInfiniteQuery(
      {
        accountId,
        limit: 10,
        ...filters,
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

  const transactions = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <TransactionFilters
        accountId={accountId}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No transactions found. Add your first transaction to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={{
                  ...transaction,
                  amount: Number(transaction.amount),
                  accountId,
                  subscription: transaction.subscription || null,
                }}
              />
            ))}
          </div>
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <div className="flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
