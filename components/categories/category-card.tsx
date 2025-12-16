'use client';

import type { CategoryType } from '@prisma/client';
import { Edit, MoreVertical, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc-client';
import { cn } from '@/lib/utils';
import { EditCategoryDialog } from './edit-category-dialog';

interface Props {
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
}

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
};

const TYPE_COLORS: Record<
  CategoryType,
  { bg: string; text: string; badge: 'default' | 'secondary' | 'outline' }
> = {
  INCOME: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    badge: 'default',
  },
  EXPENSE: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    badge: 'secondary',
  },
};

export function CategoryCard({ category }: Props) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.category.delete.useMutation({
    onSuccess: () => {
      utils.category.list.invalidate();
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate({ id: category.id });
    }
  };

  const colorConfig = TYPE_COLORS[category.type];

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-full',
                colorConfig.bg,
                colorConfig.text,
              )}
            >
              <Tag className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{category.name}</p>
                <Badge variant={colorConfig.badge}>
                  {TYPE_LABELS[category.type]}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <EditCategoryDialog
        category={category}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
