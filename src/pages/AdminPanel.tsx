import { useState, useSyncExternalStore } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { employees } from '@/lib/mock-data';
import { visitStore } from '@/lib/visit-store';
import { VisitTable } from '@/components/VisitTable';
import { Users, Download } from 'lucide-react';
import bgAdmin from '@/assets/bg-admin.jpg';

export default function AdminPanel() {
  const visits = useSyncExternalStore(visitStore.subscribe, visitStore.getVisits);
  const [activeTab, setActiveTab] = useState<'visits' | 'employees'>('visits');

  const exportCSV = () => {
    const headers = ['ID', 'Visitor', 'Company', 'Host', 'Purpose', 'Date', 'Time', 'Status', 'Type'];
    const rows = visits.map(v => [v.id, v.visitorName, v.visitorCompany, v.hostName, v.purpose, v.scheduledDate, v.scheduledTime, v.status, v.visitorType]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitflow-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout bgImage={bgAdmin}>
      <div className="p-8 lg:p-12 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-medium text-foreground tracking-tight mb-2">Admin Panel</h2>
            <p className="text-sm text-muted-foreground">Manage employees and view all visit records.</p>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
            <Download className="size-4" /> Export CSV
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {(['visits', 'employees'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-input text-muted-foreground hover:bg-secondary'
              }`}
            >
              {tab === 'visits' ? 'All Visits' : 'Employees'}
            </button>
          ))}
        </div>

        {activeTab === 'visits' && <VisitTable visits={visits} />}

        {activeTab === 'employees' && (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Department</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Mobile</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">Email</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="size-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.department}</td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">{emp.mobile}</td>
                    <td className="px-6 py-4 text-muted-foreground">{emp.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
