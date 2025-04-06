import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectForm } from './ProjectForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AddProjectDialogProps {
  accountId?: number;
  trigger?: React.ReactNode;
}

export function AddProjectDialog({ accountId, trigger }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Project</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details. Click create when you're done.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm 
          accountId={accountId} 
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}