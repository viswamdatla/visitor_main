import { Visit } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

interface VisitTableProps {
  visits: Visit[];
  onRowClick?: (visit: Visit) => void;
  showTimes?: boolean;
}

function formatTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function VisitTable({ visits, onRowClick, showTimes = false }: VisitTableProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Visitor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Company</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Host</th>
              {showTimes && (
                <>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">In Time</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Out Time</th>
                </>
              )}
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr
                key={visit.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(visit)}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{visit.visitorName}</div>
                  <div className="text-xs text-muted-foreground">{visit.visitorMobile}</div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{visit.visitorCompany}</td>
                <td className="px-6 py-4">
                  <div className="text-foreground">{visit.hostName}</div>
                  <div className="text-xs text-muted-foreground">{visit.hostDepartment}</div>
                </td>
                {showTimes && (
                  <>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">{formatTime(visit.checkInTime)}</td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">{formatTime(visit.checkOutTime)}</td>
                  </>
                )}
                <td className="px-6 py-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {visit.visitorType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={visit.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
