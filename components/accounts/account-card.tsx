'use client';

import { Edit, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc-client';
import { EditAccountDialog } from './edit-account-dialog';

interface Props {
  account: {
    id: string;
    name: string;
    currency: string;
    balance: number;
    description: string | null;
    shares: Array<{ permission: string }>;
    _count: { transactions: number };
  };
}

export function AccountCard({ account }: Props) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const utils = trpc.useUtils();

  const isShared = account.shares.length > 0;
  const permission = isShared ? account.shares[0].permission : 'owner';

  const deleteMutation = trpc.account.delete.useMutation({
    onSuccess: () => {
      utils.account.list.invalidate();
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this account? This action cannot be undone.',
      )
    ) {
      deleteMutation.mutate({ id: account.id });
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {account.name}
                {isShared && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({permission})
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {account.description || 'No description'}
              </CardDescription>
            </div>
            {permission === 'owner' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: account.currency,
                }).format(account.balance)}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{account._count.transactions} transactions</span>
              <span>{account.currency}</span>
            </div>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => router.push(`/accounts/${account.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditAccountDialog
        account={account}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
