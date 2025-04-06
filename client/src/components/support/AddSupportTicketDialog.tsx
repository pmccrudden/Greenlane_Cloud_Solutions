import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SupportTicketForm } from './SupportTicketForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AddSupportTicketDialogProps {
  accountId?: number;
  trigger?: React.ReactNode;
}

export function AddSupportTicketDialog({ accountId, trigger }: AddSupportTicketDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Support Ticket</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Support Ticket</DialogTitle>
          <DialogDescription>
            Fill in the ticket details. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <SupportTicketForm 
          accountId={accountId} 
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}