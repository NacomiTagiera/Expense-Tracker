'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc-client';
import { SubscriptionCard } from './subscription-card';

interface Props {
  accountId: string;
}

export function SubscriptionList({ accountId }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.subscription.list.useInfiniteQuery(
      {
        accountId,
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

  const subscriptions = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No subscriptions yet. Add your first subscription to track recurring
          expenses.
        </p>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive);
  const inactiveSubscriptions = subscriptions.filter((sub) => !sub.isActive);

  return (
    <div className="space-y-8">
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Subscriptions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={{
                  ...subscription,
                  amount: Number(subscription.amount),
                  accountId,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {inactiveSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Inactive Subscriptions
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {inactiveSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={{
                  ...subscription,
                  amount: Number(subscription.amount),
                  accountId,
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
