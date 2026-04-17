import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { employees } from '@/lib/mock-data';
import { visitStore } from '@/lib/visit-store';
import { toast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, Check, X, ArrowLeft } from 'lucide-react';
import bgRequestPass from '@/assets/bg-create-pass.jpg';

export default function RequestPass() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [form, setForm] = useState({
    visitorName: '',
    visitorCompany: '',
    visitorMobile: '',
    visitorEmail: '',
    visitorType: 'visitor' as 'visitor' | 'vendor',
    purpose: '',
    hostId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
  });
  const [generatedPass, setGeneratedPass] = useState<{ 
    link: string; 
    token: string; 
    visitorName: string; 
    otp: string; 
    hostName: string; 
    hostDepartment: string; 
    purpose: string; 
    date: string; 
    time: string 
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.visitorName || !form.visitorCompany || !form.visitorMobile || !form.hostId || !form.purpose || !form.scheduledDate || !form.scheduledTime) {
      toast({ title: 'Missing Fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    const host = employees.find(emp => emp.id === form.hostId);
    if (!host) {
      toast({ title: 'Invalid Host', description: 'Selected host not found.', variant: 'destructive' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
    const visit = {
      id: crypto.randomUUID(),
      ...form,
      hostName: host.name,
      hostDepartment: host.department,
      status: 'pending' as const,
      otp,
      otpExpiresAt: new Date(Date.now() + 600000).toISOString(),
      secureToken: token,
      createdAt: new Date().toISOString(),
    };

    try {
      await visitStore.addVisit(visit);
      const passLink = `${window.location.origin}/pass/${token}`;
      setGeneratedPass({ 
        link: passLink, 
        token, 
        visitorName: form.visitorName, 
        otp, 
        hostName: host.name, 
        hostDepartment: host.department, 
        purpose: form.purpose, 
        date: form.scheduledDate, 
        time: form.scheduledTime 
      });
      setStep('confirm');
      toast({ title: 'Pass Requested! ✓', description: 'Your visitor pass has been submitted for approval.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create pass. Please try again.', variant: 'destructive' });
    }
  };

  const copyLink = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (step === 'confirm' && generatedPass) {
    return (
      <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden bg-background">
        <img src={bgRequestPass} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-background/50" />
        
        <div className="relative z-10 w-full max-w-2xl glass rounded-3xl p-8">
          <button onClick={() => navigate('/request-pass')} className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="size-4" /> Back to Form
          </button>

          <div className="text-center mb-8">
            <div className="inline-block mb-4 size-16 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="size-8 text-success" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Pass Request Submitted!</h2>
            <p className="text-sm text-muted-foreground">Your pass is pending approval by {generatedPass.hostName}. Share the link below with them.</p>
          </div>

          <div className="space-y-6 mb-8">
            {/* Pass Info */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Visitor</span>
                  <span className="text-sm font-semibold text-foreground">{generatedPass.visitorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Host</span>
                  <span className="text-sm font-semibold text-foreground">{generatedPass.hostName} — {generatedPass.hostDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Purpose</span>
                  <span className="text-sm font-semibold text-foreground">{generatedPass.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date & Time</span>
                  <span className="text-sm font-semibold text-foreground">{generatedPass.date} at {generatedPass.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-warning/20 text-warning">PENDING APPROVAL</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <QRCodeSVG value={generatedPass.link} size={200} level="H" includeMargin={false} />
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Share Link</label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={generatedPass.link} 
                  className="flex-1 h-10 px-3 rounded-lg bg-muted text-sm text-foreground border border-border text-ellipsis overflow-hidden"
                />
                <button 
                  onClick={copyLink} 
                  className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-info/10 border border-info/20 rounded-lg p-4">
              <p className="text-xs text-info leading-relaxed">
                <strong>Next Steps:</strong> Share this link or QR code with {generatedPass.hostName}. They will review and approve your pass. Once approved, check your email for the OTP.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="flex-1 h-12 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors font-semibold"
            >
              Go Home
            </button>
            <button 
              onClick={() => setStep('form')} 
              className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden bg-background">
      <img src={bgRequestPass} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-background/50" />
      
      <div className="relative z-10 w-full max-w-2xl glass rounded-3xl p-8">
        <button onClick={() => navigate('/')} className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="size-4" /> Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Request Visitor Pass</h1>
          <p className="text-sm text-muted-foreground">Fill out your details to generate a visitor pass. Your host will need to approve your request.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visitor Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input 
                  type="text" 
                  name="visitorName" 
                  value={form.visitorName} 
                  onChange={handleChange}
                  placeholder="Your full name" 
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Company/Organization <span className="text-destructive">*</span>
                </label>
                <input 
                  type="text" 
                  name="visitorCompany" 
                  value={form.visitorCompany} 
                  onChange={handleChange}
                  placeholder="Your company name" 
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Mobile <span className="text-destructive">*</span>
                </label>
                <input 
                  type="tel" 
                  name="visitorMobile" 
                  value={form.visitorMobile} 
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX" 
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  name="visitorEmail" 
                  value={form.visitorEmail} 
                  onChange={handleChange}
                  placeholder="your.email@company.com" 
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visit Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Who are you visiting? <span className="text-destructive">*</span>
                </label>
                <select 
                  name="hostId" 
                  value={form.hostId} 
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a host...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Visitor Type <span className="text-destructive">*</span>
                </label>
                <select 
                  name="visitorType" 
                  value={form.visitorType} 
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="visitor">Visitor</option>
                  <option value="vendor">Vendor/Service Provider</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Purpose of Visit <span className="text-destructive">*</span>
              </label>
              <textarea 
                name="purpose" 
                value={form.purpose} 
                onChange={handleChange}
                placeholder="e.g., Business meeting, Training, Maintenance..." 
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Date <span className="text-destructive">*</span>
                </label>
                <input 
                  type="date" 
                  name="scheduledDate" 
                  value={form.scheduledDate} 
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Time <span className="text-destructive">*</span>
                </label>
                <input 
                  type="time" 
                  name="scheduledTime" 
                  value={form.scheduledTime} 
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all font-semibold"
          >
            Generate Pass Request
          </button>
        </form>
      </div>
    </div>
  );
}
