'use client';

import { AccountSharePermission } from '@prisma/client';
import { Loader2, UserPlus } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { trpc } from '@/lib/trpc-client';

interface Props {
  accountId: string;
}

export function ShareAccountDialog({ accountId }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<AccountSharePermission>(
    AccountSharePermission.VIEW,
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const utils = trpc.useUtils();

  const inviteMutation = trpc.share.invite.useMutation({
    onSuccess: () => {
      utils.account.getById.invalidate();
      setSuccess('Invitation sent successfully!');
      setEmail('');
      setPermission(AccountSharePermission.VIEW);
      setError('');
      setTimeout(() => {
        setOpen(false);
        setSuccess('');
      }, 2000);
    },
    onError: (error) => {
      setError(error.message);
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    inviteMutation.mutate({ accountId, email, permission });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Account</DialogTitle>
          <DialogDescription>
            Invite someone to access this account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={inviteMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select
              value={permission}
              onValueChange={(value: AccountSharePermission) =>
                setPermission(value)
              }
              disabled={inviteMutation.isPending}
            >
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View Only</SelectItem>
                <SelectItem value="EDIT">View & Edit</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {permission === AccountSharePermission.VIEW
                ? 'Can view transactions and reports only'
                : 'Can view and add/edit transactions'}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
