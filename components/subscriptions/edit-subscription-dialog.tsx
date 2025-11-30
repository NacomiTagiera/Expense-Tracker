'use client';

import type { SubscriptionFrequency, TransactionType } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { CategorySelector } from '@/components/category-selector';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Props {
  subscription: {
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
    accountId: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
}: Props) {
  const [name, setName] = useState(subscription.name);
  const [amount, setAmount] = useState(subscription.amount.toString());
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(
    subscription.frequency as SubscriptionFrequency,
  );
  const [transactionType, setTransactionType] = useState<TransactionType>(
    subscription.transactionType,
  );
  const [categoryId, setCategoryId] = useState(subscription.categoryId);
  const [description, setDescription] = useState(
    subscription.description || '',
  );
  const [isActive, setIsActive] = useState(subscription.isActive);
  const [endDate, setEndDate] = useState(
    subscription.endDate
      ? new Date(subscription.endDate).toISOString().split('T')[0]
      : '',
  );
  const [error, setError] = useState('');

  const utils = trpc.useUtils();

  useEffect(() => {
    setName(subscription.name);
    setAmount(subscription.amount.toString());
    setFrequency(subscription.frequency as SubscriptionFrequency);
    setTransactionType(subscription.transactionType);
    setCategoryId(subscription.categoryId);
    setDescription(subscription.description || '');
    setIsActive(subscription.isActive);
    setEndDate(
      subscription.endDate
        ? new Date(subscription.endDate).toISOString().split('T')[0]
        : '',
    );
  }, [subscription]);

  const updateMutation = trpc.subscription.update.useMutation({
    onSuccess: () => {
      utils.subscription.list.invalidate();
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
      id: subscription.id,
      name,
      amount: amountNum,
      frequency,
      transactionType,
      categoryId,
      description: description || undefined,
      isActive,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Recurring Transaction</DialogTitle>
          <DialogDescription>
            Update recurring transaction details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-transactionType">Transaction Type</Label>
            <Select
              value={transactionType}
              onValueChange={(value: TransactionType) =>
                setTransactionType(value)
              }
              disabled={updateMutation.isPending}
            >
              <SelectTrigger id="edit-transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              <Label htmlFor="edit-frequency">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(value: SubscriptionFrequency) =>
                  setFrequency(value)
                }
                disabled={updateMutation.isPending}
              >
                <SelectTrigger id="edit-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <CategorySelector
              accountId={subscription.accountId}
              id="edit-category"
              value={categoryId}
              onValueChange={setCategoryId}
              type={transactionType}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-endDate">End Date (Optional)</Label>
            <Input
              id="edit-endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
              disabled={updateMutation.isPending}
            />
            <Label htmlFor="edit-isActive" className="cursor-pointer">
              Active (automatic processing enabled)
            </Label>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
