'use client';

import type { TransactionType } from '@prisma/client';
import { format } from 'date-fns';
import {
  Calendar,
  DollarSign,
  Edit,
  MoreVertical,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc-client';
import { EditRecurringTransactionDialog } from './edit-recurring-transaction-dialog';

interface Props {
  recurringTransaction: {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    transactionType: TransactionType;
    category: string;
    categoryId: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    walletId: string;
  };
}

export function RecurringTransactionCard({ recurringTransaction }: Props) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.recurringTransaction.delete.useMutation({
    onSuccess: () => {
      utils.recurringTransaction.list.invalidate();
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      deleteMutation.mutate({ id: recurringTransaction.id });
    }
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  return (
    <>
      <Card className={recurringTransaction.isActive ? '' : 'opacity-60'}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {recurringTransaction.name}
                <Badge
                  variant={recurringTransaction.isActive ? 'default' : 'secondary'}
                >
                  {recurringTransaction.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <DollarSign className="size-5 text-muted-foreground" />
            {recurringTransaction.amount.toFixed(2)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Repeat className="size-4" />
              <span>{frequencyLabels[recurringTransaction.frequency]}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4" />
              <span>
                Started {format(new Date(recurringTransaction.startDate), 'PP')}
              </span>
            </div>
            {recurringTransaction.endDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4" />
                <span>Ends {format(new Date(recurringTransaction.endDate), 'PP')}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Category</p>
            <Badge variant="outline">{recurringTransaction.category}</Badge>
          </div>

          {recurringTransaction.description && (
            <p className="text-sm text-muted-foreground">
              {recurringTransaction.description}
            </p>
          )}
        </CardContent>
      </Card>

      <EditRecurringTransactionDialog
        recurringTransaction={recurringTransaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}

