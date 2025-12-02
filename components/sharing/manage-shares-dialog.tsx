'use client';

import { AccountShareStatus } from '@prisma/client';
import { Loader2, Trash2, Users } from 'lucide-react';
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
  accountId: string;
  account: {
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

export function ManageSharesDialog({ accountId, account }: Props) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const removeAccessMutation = trpc.share.removeAccess.useMutation({
    onSuccess: () => {
      utils.account.getById.invalidate();
    },
  });

  const handleRemoveAccess = (userId: string) => {
    if (confirm("Are you sure you want to remove this user's access?")) {
      removeAccessMutation.mutate({ accountId, userId });
    }
  };

  const activeShares = account.shares.filter(
    (share) => share.status === AccountShareStatus.ACCEPTED,
  );
  const pendingShares = account.shares.filter(
    (share) => share.status === AccountShareStatus.PENDING,
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
            View and manage users who have access to this account
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
