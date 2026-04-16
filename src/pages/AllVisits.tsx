import { useState, useMemo, useSyncExternalStore } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { VisitTable } from '@/components/VisitTable';
import { visitStore } from '@/lib/visit-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import bgAllVisits from '@/assets/bg-all-visits.jpg';

export default function AllVisits() {
  const visits = useSyncExternalStore(visitStore.subscribe, visitStore.getVisits);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    // Start with all visits by default
    let result = visits;

    // If any date filter is set, filter by date
    if (dateFrom || dateTo) {
      result = visits.filter((v) => {
        // Use check-in date if available, otherwise use scheduled date
        const dateToCheck = v.checkInTime 
          ? new Date(v.checkInTime).toISOString().split('T')[0]
          : v.scheduledDate;
        
        if (dateFrom) {
          const vDate = new Date(dateToCheck);
          if (vDate < dateFrom) return false;
        }
        if (dateTo) {
          const vDate = new Date(dateToCheck);
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (vDate > end) return false;
        }
        return true;
      });
    } else {
      // No date filter - show all visits, but prefer today's by default
      const todayStr = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter((v) => {
        const checkInDate = v.checkInTime ? new Date(v.checkInTime).toISOString().split('T')[0] : null;
        return checkInDate === todayStr || v.scheduledDate === todayStr;
      });
      // If there are visits today, show them; otherwise show all
      result = todayVisits.length > 0 ? todayVisits : visits;
    }

    // Time filter
    if (timeFrom) result = result.filter((v) => v.scheduledTime >= timeFrom);
    if (timeTo) result = result.filter((v) => v.scheduledTime <= timeTo);

    return result;
  }, [visits, todayStr, dateFrom, dateTo, timeFrom, timeTo]);

  const hasFilters = dateFrom || dateTo || timeFrom || timeTo;

  return (
    <AppLayout bgImage={bgAllVisits}>
      <div className="p-8 lg:p-12 flex-1">
        <h2 className="text-3xl font-medium text-foreground tracking-tight mb-2">All Visits</h2>
        <p className="text-sm text-muted-foreground mb-6">Complete visit log with status tracking.</p>

        {/* Filters */}
        <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-end gap-4">
          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-sm", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal h-9 text-sm", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, "dd MMM yyyy") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time From */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From Time</label>
            <Input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} className="w-[130px] h-9 text-sm" />
          </div>

          {/* Time To */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To Time</label>
            <Input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} className="w-[130px] h-9 text-sm" />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDateFrom(undefined); setDateTo(undefined); setTimeFrom(''); setTimeTo(''); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        <VisitTable visits={filtered} showTimes />
      </div>
    </AppLayout>
  );
}
