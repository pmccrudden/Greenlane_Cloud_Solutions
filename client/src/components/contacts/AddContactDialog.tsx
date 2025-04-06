import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ContactForm } from './ContactForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AddContactDialogProps {
  accountId?: number;
  trigger?: React.ReactNode;
}

export function AddContactDialog({ accountId, trigger }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Contact</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Fill in the contact details. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <ContactForm 
          accountId={accountId} 
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}