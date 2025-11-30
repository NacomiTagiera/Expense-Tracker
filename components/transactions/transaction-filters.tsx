'use client';

import type { TransactionType } from '@prisma/client';
import { X } from 'lucide-react';
import { CategorySelector } from '@/components/category-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  accountId: string;
  filters: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  };
  onFiltersChange: (filters: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export function TransactionFilters({
  accountId,
  filters,
  onFiltersChange,
}: Props) {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.type || filters.categoryId || filters.startDate || filters.endDate;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  type:
                    value === 'all' ? undefined : (value as TransactionType),
                })
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              accountId={accountId}
              id="category"
              type={filters.type || 'EXPENSE'}
              value={filters.categoryId || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  categoryId: value || undefined,
                })
              }
              placeholder="All categories"
              showAllOption
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={
                filters.startDate
                  ? filters.startDate.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  startDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={
                filters.endDate
                  ? filters.endDate.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  endDate: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                })
              }
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
