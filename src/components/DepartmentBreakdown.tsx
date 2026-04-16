import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Visit } from '@/lib/types';

const DEPT_COLORS: Record<string, string> = {
  'Engineering': 'hsl(187, 94%, 43%)',
  'IT': 'hsl(38, 92%, 50%)',
  'Sales': 'hsl(152, 69%, 41%)',
  'HR': 'hsl(262, 83%, 58%)',
  'Research': 'hsl(340, 82%, 52%)',
};
const DEFAULT_COLOR = 'hsl(215, 16%, 67%)';

interface Props {
  visits: Visit[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-lg border border-border">
      <p className="text-xs font-semibold text-foreground">
        <span className="inline-block size-2 rounded-full mr-1.5" style={{ background: d.color }} />
        {d.name}: {d.value}
      </p>
    </div>
  );
};

export function DepartmentBreakdown({ visits }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.scheduledDate === today);

  // Group by host department
  const deptMap: Record<string, number> = {};
  todayVisits.forEach(v => {
    const dept = v.hostDepartment || 'Others';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });

  const data = Object.entries(deptMap)
    .map(([name, value]) => ({ name, value, color: DEPT_COLORS[name] || DEFAULT_COLOR }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-foreground mb-1">By Department</h3>
      <p className="text-xs text-muted-foreground mb-4">Visit distribution today</p>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No visits today yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-[120px] h-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[11px] text-muted-foreground truncate flex-1">{d.name}</span>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{d.value}</span>
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
