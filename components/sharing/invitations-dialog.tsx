'use client';

import { Check, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc-client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationsDialog({ open, onOpenChange }: Props) {
  const { data: invitations, isLoading } =
    trpc.share.listInvitations.useQuery();
  const utils = trpc.useUtils();

  const respondMutation = trpc.share.respondToInvitation.useMutation({
    onSuccess: () => {
      utils.share.listInvitations.invalidate();
      utils.account.list.invalidate();
    },
  });

  const handleRespond = (shareId: string, accept: boolean) => {
    respondMutation.mutate({ shareId, accept });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wallet Invitations</DialogTitle>
          <DialogDescription>
            Manage your pending wallet sharing invitations
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !invitations || invitations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No pending invitations
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {invitation.account.name}
                        </h3>
                        <Badge>{invitation.permission}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Invited by{' '}
                        {invitation.account.user.name ||
                          invitation.account.user.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(invitation.id, true)}
                        disabled={respondMutation.isPending}
                        className="flex-1"
                      >
                        <Check className="mr-2 size-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(invitation.id, false)}
                        disabled={respondMutation.isPending}
                        className="flex-1"
                      >
                        <X className="mr-2 size-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
