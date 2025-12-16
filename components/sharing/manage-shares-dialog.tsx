'use client';

import { WalletSharePermission, WalletShareStatus } from '@prisma/client';
import { Loader2, Settings, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc-client';

interface Props {
  walletId: string;
  wallet: {
    shares: Array<{
      id: string;
      userId: string;
      permission: string;
      status: string;
      user: {
        name: string | null;
        email: string;
      };
    }>;
  };
}

export function ManageSharesDialog({ walletId, wallet }: Props) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const removeAccessMutation = trpc.share.removeAccess.useMutation({
    onSuccess: () => {
      utils.wallet.getById.invalidate();
    },
  });

  const updatePermissionMutation = trpc.share.updatePermission.useMutation({
    onSuccess: () => {
      utils.wallet.getById.invalidate();
    },
  });

  const handleRemoveAccess = (userId: string) => {
    if (confirm("Are you sure you want to remove this user's access?")) {
      removeAccessMutation.mutate({ walletId, userId });
    }
  };

  const handleUpdatePermission = (userId: string, currentPermission: string) => {
    const newPermission = currentPermission === 'VIEW' ? WalletSharePermission.EDIT : WalletSharePermission.VIEW;
    const action = newPermission === WalletSharePermission.EDIT ? 'grant edit access' : 'revoke edit access';

    if (confirm(`Are you sure you want to ${action} for this user?`)) {
      updatePermissionMutation.mutate({
        walletId,
        userId,
        permission: newPermission,
      });
    }
  };

  const activeShares = wallet.shares.filter(
    (share) => share.status === WalletShareStatus.ACCEPTED,
  );
  const pendingShares = wallet.shares.filter(
    (share) => share.status === WalletShareStatus.PENDING,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 size-4" />
          Manage ({activeShares.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Shared Access</DialogTitle>
          <DialogDescription>
            View and manage users who have access to this wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {activeShares.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Active Users</h3>
              {activeShares.map((share) => (
                <Card key={share.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium">
                        {share.user.name || share.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {share.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{share.permission}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUpdatePermission(share.userId, share.permission)}
                        disabled={updatePermissionMutation.isPending}
                        title={`Change to ${share.permission === 'VIEW' ? 'Edit' : 'View'} permission`}
                      >
                        {updatePermissionMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Settings className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAccess(share.userId)}
                        disabled={removeAccessMutation.isPending}
                      >
                        {removeAccessMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendingShares.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Pending Invitations
              </h3>
              {pendingShares.map((share) => (
                <Card key={share.id} className="opacity-60">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium">
                        {share.user.name || share.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {share.user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Pending</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAccess(share.userId)}
                        disabled={removeAccessMutation.isPending}
                      >
                        {removeAccessMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeShares.length === 0 && pendingShares.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No users have access to this wallet yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
