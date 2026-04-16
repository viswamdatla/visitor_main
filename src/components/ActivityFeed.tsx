import { Visit } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { Clock, UserCheck, UserX, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  visits: Visit[];
}

const statusIcon: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-warning' },
  approved: { icon: UserCheck, color: 'text-primary' },
  checked_in: { icon: LogIn, color: 'text-success' },
  checked_out: { icon: LogOutIcon, color: 'text-muted-foreground' },
  denied: { icon: UserX, color: 'text-destructive' },
};

export function ActivityFeed({ visits }: ActivityFeedProps) {
  const recent = visits.slice(0, 6);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time visit updates</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-success font-semibold uppercase tracking-wider">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-0">
        {recent.map((visit, i) => {
          const config = statusIcon[visit.status] || statusIcon.pending;
          const IconComp = config.icon;
          return (
            <div key={visit.id} className="flex items-start gap-3 relative">
              {/* Timeline line */}
              {i < recent.length - 1 && (
                <div className="absolute left-[15px] top-[32px] w-px h-[calc(100%-16px)] bg-border" />
              )}
              <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0 bg-muted-foreground/5', config.color)}>
                <IconComp className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0 py-1.5 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{visit.visitorName}</span>
                  <StatusBadge status={visit.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {visit.visitorCompany} → {visit.hostName}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{visit.scheduledTime} • {visit.purpose}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
