'use client';

import type { CategoryType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc-client';
import { CategoryCard } from './category-card';

interface Props {
  accountId: string;
}

export function CategoryList({ accountId }: Props) {
  const [typeFilter, setTypeFilter] = useState<CategoryType | 'ALL'>('ALL');

  const { data: categories, isLoading } = trpc.category.list.useQuery({
    accountId,
    ...(typeFilter !== 'ALL' && { type: typeFilter as CategoryType }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="type-filter">Filter by Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(value: CategoryType | 'ALL') =>
                setTypeFilter(value)
              }
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="INVESTMENT">Investment</SelectItem>
                <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!categories || categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No categories found. Create your first category to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
