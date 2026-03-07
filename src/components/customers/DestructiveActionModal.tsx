'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Archive, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface DestructiveActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  onConfirm: () => Promise<void>;
  actionType: 'archive' | 'delete';
  loading?: boolean;
}

export function DestructiveActionModal({
  open,
  onOpenChange,
  customerName,
  onConfirm,
  actionType,
  loading = false,
}: DestructiveActionModalProps) {
  const tCommon = useTranslations('common');
  const tArchive = useTranslations('customers.archive');
  const tDelete = useTranslations('customers.deleteCustomer');

  const isArchive = actionType === 'archive';

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mb-4',
            isArchive ? 'bg-orange-100' : 'bg-red-100'
          )}>
            {isArchive ? (
              <Archive className="h-6 w-6 text-orange-600" />
            ) : (
              <Trash2 className="h-6 w-6 text-red-600" />
            )}
          </div>
          <AlertDialogTitle className="font-display">
            {isArchive ? tArchive('title') : tDelete('title')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {isArchive ? (
                  <>
                    {tArchive('descriptionPrefix')} <strong>{customerName}</strong>{tArchive('descriptionSuffix')}
                  </>
                ) : (
                  <>
                    {tDelete('descriptionPrefix')} <span className="text-red-600 font-semibold">{tDelete('descriptionHighlight')}</span> <strong>{customerName}</strong>{tDelete('descriptionSuffix') ? ` ${tDelete('descriptionSuffix')}` : ''}
                  </>
                )}
              </p>
              <p className={cn("text-sm", isArchive ? "text-muted-foreground" : "text-red-600")}>
                {isArchive ? tArchive('hint') : tDelete('hint')}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                isArchive
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isArchive ? tArchive('confirm') : tDelete('confirm')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
