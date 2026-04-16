import { Visit } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', className: 'bg-primary/10 text-primary' },
  checked_in: { label: 'Checked In', className: 'bg-success/10 text-success' },
  checked_out: { label: 'Checked Out', className: 'bg-muted-foreground/10 text-muted-foreground' },
  expired: { label: 'Expired', className: 'bg-destructive/10 text-destructive' },
  denied: { label: 'Denied', className: 'bg-destructive/10 text-destructive' },
};

export function StatusBadge({ status }: { status: Visit['status'] }) {
  const config = statusConfig[status];
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', config.className)}>
      {config.label}
    </span>
  );
}
