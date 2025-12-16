'use client';

import { format } from 'date-fns';
import {
  Edit,
  MoreVertical,
  Repeat,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
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
import { EditTransactionDialog } from './edit-transaction-dialog';

interface Props {
  transaction: {
    id: string;
    amount: number;
    type: string;
    category: string;
    categoryId: string;
    description: string | null;
    date: Date;
    walletId: string;
    recurringTransaction?: {
      id: string;
      name: string;
    } | null;
    user?: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
}

export function TransactionCard({ transaction }: Props) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const utils = trpc.useUtils();

  const deleteMutation = trpc.transaction.delete.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.wallet.getById.invalidate();
      utils.wallet.list.invalidate();
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate({ id: transaction.id });
    }
  };

  const isIncome = transaction.type === 'INCOME';

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isIncome
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {isIncome ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{transaction.category}</p>
                <Badge variant={isIncome ? 'default' : 'secondary'}>
                  {transaction.type}
                </Badge>
                {transaction.recurringTransaction && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Repeat className="size-3" />
                    {transaction.recurringTransaction.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {transaction.description || 'No description'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <p>{format(new Date(transaction.date), 'PPP')}</p>
                {transaction.user && (
                  <>
                    <span>•</span>
                    <p>{transaction.user.name || transaction.user.email}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p
              className={`text-xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
            >
              {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
            </p>
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
        </CardContent>
      </Card>

      <EditTransactionDialog
        transaction={transaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
