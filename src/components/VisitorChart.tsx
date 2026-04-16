import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Visit } from '@/lib/types';

interface Props {
  visits: Visit[];
}

const HOURS = ['7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM'];

function buildChartData(visits: Visit[]) {
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.scheduledDate === today);

  return HOURS.map(label => {
    const hourVisits = todayVisits.filter(v => {
      if (!v.checkInTime) return false;
      const checkInDate = new Date(v.checkInTime);
      const hour = checkInDate.getHours();
      const idx = HOURS.indexOf(label);
      const targetHour = idx + 7; // 7 AM = index 0
      return hour === targetHour;
    });
    return {
      time: label,
      visitors: hourVisits.filter(v => v.visitorType === 'visitor').length,
      vendors: hourVisits.filter(v => v.visitorType === 'vendor').length,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-lg border border-border">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full mr-1.5" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export function VisitorChart({ visits }: Props) {
  const data = buildChartData(visits);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Today's Traffic</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Visitors & vendors by hour</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Visitors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendors</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(187, 94%, 43%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 80%)" strokeOpacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="visitors" name="Visitors" stroke="hsl(187, 94%, 43%)" fill="url(#colorVisitors)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="vendors" name="Vendors" stroke="hsl(38, 92%, 50%)" fill="url(#colorVendors)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
