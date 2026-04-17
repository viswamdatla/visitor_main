import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { employees } from '@/lib/mock-data';
import { visitStore } from '@/lib/visit-store';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Share2, Check, X } from 'lucide-react';
import bgCreatePass from '@/assets/bg-create-pass.jpg';
import { useAuth } from '@/lib/auth.tsx';

export default function CreatePass() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [form, setForm] = useState({
    visitorName: '',
    visitorCompany: '',
    visitorMobile: '',
    visitorType: 'visitor' as 'visitor' | 'vendor',
    purpose: '',
    hostId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
  });
  const [generatedPass, setGeneratedPass] = useState<{ link: string; token: string; visitorName: string; otp: string; hostName: string; hostDepartment: string; purpose: string; date: string; time: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const host = employees.find(emp => emp.id === form.hostId);
    if (!host) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const visit = {
      id: crypto.randomUUID(),
      ...form,
      hostName: host.name,
      hostDepartment: host.department,
      status: 'approved' as const,
      otp,
      otpExpiresAt: new Date(Date.now() + 600000).toISOString(),
      secureToken: token,
      createdAt: new Date().toISOString(),
    };

    await visitStore.addVisit(visit);

    const passLink = `${window.location.origin}/pass/${token}`;
    setGeneratedPass({ link: passLink, token, visitorName: form.visitorName, otp, hostName: host.name, hostDepartment: host.department, purpose: form.purpose, date: form.scheduledDate, time: form.scheduledTime });
  };

  const copyLink = async () => {
    if (!generatedPass) return;
    try {
      await navigator.clipboard.writeText(generatedPass.link);
      setCopied(true);
      toast({ title: 'Link Copied!', description: 'Pass link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  const downloadQR = () => {
    if (!qrRef.current || !generatedPass) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 480;
    const H = 720;
    canvas.width = W;
    canvas.height = H;

    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      // Header
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VisitFlow', W / 2, 50);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('DIGITAL VISITOR PASS', W / 2, 70);

      // QR Code (white bg)
      const qrSize = 200;
      const qrX = (W - qrSize - 24) / 2;
      const qrY = 90;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, qrX, qrY, qrSize + 24, qrSize + 24, 16);
      ctx.fill();
      ctx.drawImage(img, qrX + 12, qrY + 12, qrSize, qrSize);
      URL.revokeObjectURL(url);

      // OTP Section
      const otpY = qrY + qrSize + 50;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('ONE-TIME PASSWORD', W / 2, otpY);
      ctx.letterSpacing = '0px';
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(generatedPass.otp.split('').join(' '), W / 2, otpY + 38);

      // Details Section
      let detY = otpY + 70;
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, 32, detY, W - 64, 220, 12);
      ctx.fill();

      detY += 30;
      const details = [
        ['Visitor', generatedPass.visitorName],
        ['Host', `${generatedPass.hostName} — ${generatedPass.hostDepartment}`],
        ['Purpose', generatedPass.purpose],
        ['Date & Time', `${generatedPass.date} at ${generatedPass.time}`],
      ];

      details.forEach(([label, value]) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.fillText(label.toUpperCase(), 52, detY);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '13px sans-serif';
        const maxW = W - 100;
        ctx.fillText(value.length > 35 ? value.slice(0, 35) + '…' : value, W - 52, detY);
        detY += 44;
      });

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText('Show this pass at the security gate for entry', W / 2, H - 20);

      const a = document.createElement('a');
      a.download = `visitor-pass-${generatedPass.token.slice(0, 8)}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const sharePass = async () => {
    if (!generatedPass) return;
    const shareData = {
      title: 'VisitFlow - Visitor Pass',
      text: `Visitor Pass for ${generatedPass.visitorName}. OTP: ${generatedPass.otp}`,
      url: generatedPass.link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      copyLink();
    }
  };

  const closeModal = () => {
    setGeneratedPass(null);
    setForm({
      visitorName: '', visitorCompany: '', visitorMobile: '',
      visitorType: 'visitor', purpose: '', hostId: '',
      scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '',
    });
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <AppLayout bgImage={bgCreatePass}>
      <div className="p-8 lg:p-12 flex-1 max-w-3xl">
        <h2 className="text-3xl font-medium text-foreground tracking-tight mb-2">
          Issue Visitor Pass
        </h2>
        <p className="text-sm text-muted-foreground mb-10">
          Fill in the details to generate a digital pass with QR code and OTP.
        </p>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8">
          <div className="flex flex-col gap-6">
            <div className="flex gap-3">
              {(['visitor', 'vendor'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update('visitorType', type)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    form.visitorType === type
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-input text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Visitor Name" value={form.visitorName} onChange={v => update('visitorName', v)} placeholder="Full name" required />
              <InputField label="Company" value={form.visitorCompany} onChange={v => update('visitorCompany', v)} placeholder="Company name" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Mobile Number" value={form.visitorMobile} onChange={v => update('visitorMobile', v)} placeholder="+91 XXXXX XXXXX" required />
              <InputField label="Purpose of Visit" value={form.purpose} onChange={v => update('purpose', v)} placeholder="Meeting, Maintenance, etc." required />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] pl-4">Host Employee</label>
              <select
                value={form.hostId}
                onChange={e => update('hostId', e.target.value)}
                required
                className="w-full bg-input rounded-2xl px-5 py-4 text-sm text-foreground outline-none transition-all focus:bg-secondary focus:shadow-md appearance-none"
              >
                <option value="">Select host employee...</option>
                {employees.filter(emp => {
                  if (!role || ['admin', 'guard', 'receptionist'].includes(role)) return true;
                  const dept = emp.department.toLowerCase();
                  if (role === 'sales') return dept === 'sales' || dept === 'marketing';
                  return dept === role;
                }).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField label="Date" type="date" value={form.scheduledDate} onChange={v => update('scheduledDate', v)} required />
              <InputField label="Time" type="time" value={form.scheduledTime} onChange={v => update('scheduledTime', v)} required />
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              Generate Pass & Send Link
              <span className="block size-1.5 rounded-full bg-primary animate-pulse" />
            </button>
          </div>
        </form>
      </div>

      {/* Generated Pass Modal */}
      {generatedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative my-auto max-h-[95vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 size-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="size-4 text-muted-foreground" />
            </button>

            <div className="text-center mb-4">
              <div className="size-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                <Check className="size-5 text-success" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Pass Generated!</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Share the QR code or link with {generatedPass.visitorName}</p>
            </div>

            {/* QR Code */}
            <div ref={qrRef} className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <QRCodeSVG
                  value={generatedPass.link}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* OTP */}
            <div className="glass rounded-xl p-3 mb-3 text-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] block mb-0.5">One-Time Password</span>
              <span className="text-xl font-bold text-foreground tracking-[0.3em] tabular-nums">{generatedPass.otp}</span>
            </div>

            {/* Host Info */}
            <div className="glass rounded-xl p-2.5 mb-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] block mb-0.5">Generated By</span>
              <span className="text-sm font-medium text-foreground">{generatedPass.hostName}</span>
              <span className="text-xs text-muted-foreground ml-1">— {generatedPass.hostDepartment}</span>
            </div>

            {/* Link */}
            <div className="glass rounded-xl p-2.5 mb-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate flex-1">{generatedPass.link}</span>
              <button onClick={copyLink} className="shrink-0 size-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5 text-primary" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={downloadQR} className="flex-1 h-12 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm">
                <Download className="size-4" /> Download Pass
              </button>
              <button onClick={sharePass} className="flex-1 h-12 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm">
                <Share2 className="size-4" /> Share
              </button>
            </div>

            <button
              onClick={() => { closeModal(); navigate('/'); }}
              className="w-full mt-3 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function InputField({
  label, value, onChange, placeholder, type = 'text', required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] pl-4">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-input rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:bg-secondary focus:shadow-md"
      />
    </div>
  );
}
