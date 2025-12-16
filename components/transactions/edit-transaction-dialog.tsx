'use client';

import type { TransactionType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { CategorySelector } from '@/components/category-selector';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc-client';

interface EditTransactionDialogProps {
  transaction: {
    id: string;
    amount: number;
    type: string;
    category: string;
    categoryId: string;
    description: string | null;
    date: Date;
    walletId: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<TransactionType>(
    transaction.type as TransactionType,
  );
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState(
    new Date(transaction.date).toISOString().split('T')[0],
  );
  const [error, setError] = useState('');

  const utils = trpc.useUtils();

  useEffect(() => {
    setAmount(transaction.amount.toString());
    setType(transaction.type as TransactionType);
    setCategoryId(transaction.categoryId);
    setDescription(transaction.description || '');
    setDate(new Date(transaction.date).toISOString().split('T')[0]);
  }, [transaction]);

  const updateMutation = trpc.transaction.update.useMutation({
    onSuccess: () => {
      utils.transaction.list.invalidate();
      utils.wallet.getById.invalidate();
      utils.wallet.list.invalidate();
      onOpenChange(false);
      setError('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    updateMutation.mutate({
      id: transaction.id,
      amount: amountNum,
      type,
      categoryId,
      description: description || undefined,
      date: new Date(date),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update transaction details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: TransactionType) => setType(value)}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <CategorySelector
              walletId={transaction.walletId}
              id="edit-category"
              value={categoryId}
              onValueChange={setCategoryId}
              type={type}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
