'use client';

import type { CategoryType } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc-client';
import { Skeleton } from './ui/skeleton';

interface CategorySelectorProps {
  walletId: string;
  value: string;
  onValueChange: (value: string) => void;
  type: CategoryType;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export function CategorySelector({
  walletId,
  value,
  onValueChange,
  type,
  disabled,
  placeholder = 'Select a category',
  id,
  showAllOption = false,
  allOptionLabel = 'All categories',
}: CategorySelectorProps) {
  const { data: categories, isLoading } = trpc.category.list.useQuery({
    walletId,
    type,
  });

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!categories || categories.length === 0) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select
      value={value || (showAllOption ? 'all' : '')}
      onValueChange={(val) => onValueChange(val === 'all' ? '' : val)}
      disabled={disabled}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAllOption && <SelectItem value="all">{allOptionLabel}</SelectItem>}
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
