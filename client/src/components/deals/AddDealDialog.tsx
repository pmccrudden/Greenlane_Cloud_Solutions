import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DealForm } from './DealForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AddDealDialogProps {
  accountId?: number;
  trigger?: React.ReactNode;
}

export function AddDealDialog({ accountId, trigger }: AddDealDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Deal</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>
            Fill in the deal details. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <DealForm 
          accountId={accountId} 
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}