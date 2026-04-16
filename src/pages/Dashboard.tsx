import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Users, Truck, ShieldCheck, Activity, Clock, CalendarDays, X, LogOut, Copy, Download, Share2, Check } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { StatCard } from '@/components/StatCard';
import { VisitTable } from '@/components/VisitTable';
import { VisitorChart } from '@/components/VisitorChart';
import { DepartmentBreakdown } from '@/components/DepartmentBreakdown';
import { ActivityFeed } from '@/components/ActivityFeed';
import { visitStore } from '@/lib/visit-store';
import { Visit } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from '@/hooks/use-toast';
import bgDashboard from '@/assets/bg-dashboard.jpg';

type FilterType = 'visitors' | 'vendors' | 'active' | 'checked_in' | 'checked_out' | null;

function filterVisits(visits: Visit[], filter: FilterType): Visit[] {
  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.scheduledDate === today);
  switch (filter) {
    case 'visitors': return todayVisits.filter(v => v.visitorType === 'visitor');
    case 'vendors': return todayVisits.filter(v => v.visitorType === 'vendor');
    case 'active': return todayVisits.filter(v => ['approved', 'checked_in'].includes(v.status));
    case 'checked_in': return todayVisits.filter(v => v.status === 'checked_in');
    case 'checked_out': return todayVisits.filter(v => v.status === 'checked_out');
    default: return [];
  }
}

const filterLabels: Record<string, string> = {
  visitors: "Today's Visitors",
  vendors: "Today's Vendors",
  active: 'Active Passes',
  checked_in: 'Checked In Now',
  checked_out: 'Checked Out Today',
};

export default function Dashboard() {
  const visits = useSyncExternalStore(visitStore.subscribe, visitStore.getVisits);
  const stats = visitStore.getStats();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.scheduledDate === todayStr);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggle = (filter: FilterType) => setActiveFilter(prev => prev === filter ? null : filter);
  const filteredVisits = activeFilter ? filterVisits(visits, activeFilter) : [];

  const passLink = selectedVisit ? `${window.location.origin}/pass/${selectedVisit.secureToken}` : '';

  const copyLink = async () => {
    if (!selectedVisit) return;
    try {
      await navigator.clipboard.writeText(passLink);
      setCopied(true);
      toast({ title: 'Link Copied!', description: 'Pass link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  const sharePass = async () => {
    if (!selectedVisit) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'VisitFlow - Visitor Pass', text: `Pass for ${selectedVisit.visitorName}. OTP: ${selectedVisit.otp}`, url: passLink }); } catch {}
    } else {
      copyLink();
    }
  };

  const downloadQR = () => {
    if (!qrRef.current || !selectedVisit) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 480, H = 720;
    canvas.width = W; canvas.height = H;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('VisitFlow', W / 2, 50);
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif';
      ctx.fillText('DIGITAL VISITOR PASS', W / 2, 70);
      const qrSize = 200, qrX = (W - qrSize - 24) / 2, qrY = 90;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(qrX, qrY, qrSize + 24, qrSize + 24, 16); ctx.fill();
      ctx.drawImage(img, qrX + 12, qrY + 12, qrSize, qrSize);
      URL.revokeObjectURL(url);
      const otpY = qrY + qrSize + 50;
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.fillText('ONE-TIME PASSWORD', W / 2, otpY);
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 36px monospace';
      ctx.fillText(selectedVisit.otp.split('').join(' '), W / 2, otpY + 38);
      let detY = otpY + 70;
      ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.roundRect(32, detY, W - 64, 220, 12); ctx.fill();
      detY += 30;
      const details = [
        ['Visitor', selectedVisit.visitorName],
        ['Host', `${selectedVisit.hostName} — ${selectedVisit.hostDepartment}`],
        ['Purpose', selectedVisit.purpose],
        ['Date & Time', `${selectedVisit.scheduledDate} at ${selectedVisit.scheduledTime}`],
      ];
      details.forEach(([label, value]) => {
        ctx.textAlign = 'left'; ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif';
        ctx.fillText(label.toUpperCase(), 52, detY);
        ctx.textAlign = 'right'; ctx.fillStyle = '#e2e8f0'; ctx.font = '13px sans-serif';
        ctx.fillText(value.length > 35 ? value.slice(0, 35) + '…' : value, W - 52, detY);
        detY += 44;
      });
      ctx.textAlign = 'center'; ctx.fillStyle = '#475569'; ctx.font = '10px sans-serif';
      ctx.fillText('Show this pass at the security gate for entry', W / 2, H - 20);
      const a = document.createElement('a');
      a.download = `visitor-pass-${selectedVisit.secureToken.slice(0, 8)}.png`;
      a.href = canvas.toDataURL('image/png'); a.click();
    };
    img.src = url;
  };

  return (
    <AppLayout bgImage={bgDashboard}>
      <div className="p-6 lg:p-10 flex-1">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight mb-1">Command Center</h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="block size-2 rounded-full bg-success animate-pulse" />
                System Active
              </span>
              <span className="w-px h-4 bg-foreground/10" />
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {today}
              </span>
            </div>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground tabular-nums">{time}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Visitors Today" value={stats.totalVisitorsToday} icon={Users} trend={{ value: 12, label: 'vs yesterday' }} onClick={() => toggle('visitors')} />
          <StatCard title="Vendors Today" value={stats.totalVendorsToday} icon={Truck} trend={{ value: -5, label: 'vs yesterday' }} onClick={() => toggle('vendors')} />
          <StatCard title="Active Passes" value={stats.activePasses} icon={ShieldCheck} accent trend={{ value: 8, label: 'vs avg' }} onClick={() => toggle('active')} />
          <StatCard title="Checked In" value={stats.checkedInToday} icon={Activity} trend={{ value: 15, label: 'vs yesterday' }} onClick={() => toggle('checked_in')} />
          <StatCard title="Checked Out" value={stats.checkedOutToday} icon={LogOut} trend={{ value: 0, label: 'today' }} onClick={() => toggle('checked_out')} />
        </div>

        {activeFilter && (
          <div className="mb-8 glass rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{filterLabels[activeFilter]}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredVisits.length} {filteredVisits.length === 1 ? 'record' : 'records'} found</p>
              </div>
              <button onClick={() => setActiveFilter(null)} className="size-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            {filteredVisits.length > 0 ? <VisitTable visits={filteredVisits} onRowClick={setSelectedVisit} /> : <p className="text-sm text-muted-foreground text-center py-8">No records for this filter.</p>}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2"><VisitorChart visits={visits} /></div>
          <DepartmentBreakdown visits={visits} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Today's Visits</h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{todayVisits.length} entries</span>
            </div>
            <VisitTable visits={todayVisits} onRowClick={setSelectedVisit} />
          </div>
          <ActivityFeed visits={todayVisits} />
        </div>
      </div>

      {/* Pass Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative my-auto max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVisit(null)}
              className="absolute top-4 right-4 size-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-base font-semibold text-foreground">{selectedVisit.visitorName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedVisit.visitorCompany} • {selectedVisit.visitorType}</p>
            </div>

            {/* QR Code */}
            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <QRCodeSVG value={passLink} size={150} level="H" includeMargin={false} />
              </div>
            </div>

            {/* OTP */}
            <div className="glass rounded-xl p-3 mb-3 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] block mb-0.5">One-Time Password</span>
              <span className="text-xl font-bold text-foreground tracking-[0.3em] tabular-nums">{selectedVisit.otp}</span>
            </div>

            {/* Details */}
            <div className="glass rounded-xl p-3 mb-3 space-y-2">
              <DetailRow label="Host" value={`${selectedVisit.hostName} — ${selectedVisit.hostDepartment}`} />
              <DetailRow label="Purpose" value={selectedVisit.purpose} />
              <DetailRow label="Scheduled" value={`${selectedVisit.scheduledDate} at ${selectedVisit.scheduledTime}`} />
              <DetailRow label="Status" value={selectedVisit.status.replace('_', ' ').toUpperCase()} />
              {selectedVisit.checkInTime && <DetailRow label="In Time" value={new Date(selectedVisit.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />}
              {selectedVisit.checkOutTime && <DetailRow label="Out Time" value={new Date(selectedVisit.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} />}
            </div>

            {/* Link */}
            <div className="glass rounded-xl p-2.5 mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate flex-1">{passLink}</span>
              <button onClick={copyLink} className="shrink-0 size-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5 text-primary" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={downloadQR} className="flex-1 h-12 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm">
                <Download className="size-4" /> Download
              </button>
              <button onClick={sharePass} className="flex-1 h-12 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm">
                <Share2 className="size-4" /> Share
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-xs font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
