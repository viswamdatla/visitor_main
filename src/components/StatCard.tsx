import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, accent, className, trend, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-2xl p-6 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-lg hover:-translate-y-0.5 group',
        accent && 'border-primary/30 bg-primary/5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground">
          {title}
        </span>
        <div className={cn(
          'size-10 rounded-xl flex items-center justify-center transition-colors',
          accent ? 'bg-primary/15 group-hover:bg-primary/25' : 'bg-muted-foreground/10 group-hover:bg-muted-foreground/15'
        )}>
          <Icon className={cn('size-5', accent ? 'text-primary' : 'text-muted-foreground')} />
        </div>
      </div>
      <div>
        <span className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.value >= 0 ? (
              <TrendingUp className="size-3 text-success" />
            ) : (
              <TrendingDown className="size-3 text-destructive" />
            )}
            <span className={cn(
              'text-[10px] font-semibold',
              trend.value >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-[10px] text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
