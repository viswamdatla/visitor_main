import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { visitStore } from '@/lib/visit-store';
import { StatusBadge } from '@/components/StatusBadge';
import { Visit } from '@/lib/types';
import { ShieldCheck, ShieldX, ScanLine, Camera, X, KeyRound, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import bgSecurity from '@/assets/bg-security.jpg';

export default function SecurityDashboard() {
  const visits = useSyncExternalStore(visitStore.subscribe, visitStore.getVisits);
  const [scanInput, setScanInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [directOtp, setDirectOtp] = useState('');
  const [scannedVisit, setScannedVisit] = useState<Visit | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const processQRData = useCallback((data: string) => {
    let token = data.trim();
    
    // Attempt to extract token if it's a URL or JSON
    try {
      if (token.startsWith('http')) {
        const url = new URL(token);
        const match = url.pathname.match(/\/pass\/(.+)/);
        if (match) token = match[1];
      } else {
        const parsed = JSON.parse(token);
        if (parsed.token) token = parsed.token;
      }
    } catch {}

    const visit = visitStore.getVisits().find(v => v.secureToken === token || v.id === token);

    if (visit) {
      setScannedVisit(visit);
      setScanInput(token);
      toast({ title: 'QR Scanned ✓', description: `Found pass for ${visit.visitorName}` });
    } else {
      setScanInput(token);
      toast({ title: 'Invalid QR Code', description: 'No matching pass found.', variant: 'destructive' });
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraOpen(true);
    // Wait for DOM element to render
    await new Promise(r => setTimeout(r, 300));

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            processQRData(decodedText);
          },
          () => {}
        );
      } catch (err) {
        // Try user-facing camera as fallback
        try {
          await scanner.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              processQRData(decodedText);
            },
            () => {}
          );
        } catch {
          toast({ title: 'Camera Error', description: 'Could not access camera. Please allow camera permissions.', variant: 'destructive' });
          setCameraOpen(false);
          scannerRef.current = null;
        }
      }
    } catch (error) {
      toast({ title: 'Camera Error', description: 'Could not initialize camera.', variant: 'destructive' });
      setCameraOpen(false);
    }
  }, [processQRData, stopCamera]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); scannerRef.current.clear(); } catch {}
      }
    };
  }, []);

  const handleManualScan = () => {
    if (!scanInput.trim()) {
      startCamera();
      return;
    }
    processQRData(scanInput);
  };

  const handleVerifyOTP = async () => {
    if (!scannedVisit) return;
    
    // Check if OTP has expired
    if (scannedVisit.otpExpiresAt) {
      const expiryTime = new Date(scannedVisit.otpExpiresAt).getTime();
      if (Date.now() > expiryTime) {
        toast({ title: 'OTP Expired', description: 'The OTP has expired. Please request a new pass.', variant: 'destructive' });
        return;
      }
    }
    
    // Check if OTP matches (convert both to string for consistent comparison)
    const otpToCompare = String(scannedVisit.otp).trim();
    const userOtp = String(otpInput).trim();
    
    if (otpToCompare === userOtp && otpToCompare !== '') {
      const now = new Date().toISOString();
      await visitStore.updateVisit(scannedVisit.id, { status: 'checked_in', checkInTime: now });
      setScannedVisit({ ...scannedVisit, status: 'checked_in', checkInTime: now });
      toast({ title: 'Entry Allowed ✓', description: `${scannedVisit.visitorName} has been checked in.` });
      setOtpInput('');
    } else {
      toast({ title: 'Invalid OTP', description: 'The OTP does not match. Please try again.', variant: 'destructive' });
    }
  };

  const handleAllowEntry = async () => {
    if (!scannedVisit) return;
    
    // Check if pass is for today
    const today = new Date().toISOString().split('T')[0];
    if (scannedVisit.scheduledDate !== today) {
      toast({ title: 'Invalid Pass Date', description: 'This pass is not valid for today.', variant: 'destructive' });
      return;
    }
    
    // Check if already checked out
    if (scannedVisit.status === 'checked_out') {
      toast({ title: 'Already Checked Out', description: 'This visitor has already checked out and cannot check in again.', variant: 'destructive' });
      return;
    }
    
    // Check if already checked in
    if (scannedVisit.status === 'checked_in') {
      toast({ title: 'Already Checked In', description: 'This visitor is already checked in.', variant: 'destructive' });
      return;
    }
    
    const now = new Date().toISOString();
    await visitStore.updateVisit(scannedVisit.id, { status: 'checked_in', checkInTime: now });
    setScannedVisit({ ...scannedVisit, status: 'checked_in', checkInTime: now });
    toast({ title: 'Entry Allowed ✓', description: `${scannedVisit.visitorName} has been checked in.` });
    
    // Reset for next scan (keep camera open)
    setScannedVisit(null);
    setScanInput('');
    setOtpInput('');
  };

  const handleDeny = async () => {
    if (!scannedVisit) return;
    await visitStore.updateVisit(scannedVisit.id, { status: 'denied' });
    setScannedVisit({ ...scannedVisit, status: 'denied' });
    toast({ title: 'Entry Denied', description: `${scannedVisit.visitorName} has been denied entry.` });
    
    // Reset for next scan (keep camera open)
    setScannedVisit(null);
    setScanInput('');
    setOtpInput('');
  };

  const handleCheckOut = async (visit: Visit) => {
    const now = new Date().toISOString();
    await visitStore.updateVisit(visit.id, { status: 'checked_out', checkOutTime: now });
    if (scannedVisit?.id === visit.id) {
      setScannedVisit({ ...scannedVisit, status: 'checked_out', checkOutTime: now });
    }
    toast({ title: 'Checked Out ✓', description: `${visit.visitorName} has been checked out.` });
  };

  const handleDirectOtp = async () => {
    if (!directOtp.trim()) {
      toast({ title: 'Enter OTP', description: 'Please enter the 6-digit OTP.', variant: 'destructive' });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const visit = visits.find(v => {
      // Check if OTP matches
      if (String(v.otp).trim() !== String(directOtp).trim()) return false;
      // Check if status is approved
      if (v.status === 'checked_out') return false; // Cannot check in if already checked out
      if (v.status === 'checked_in') return false; // Cannot check in if already checked in
      if (v.status !== 'approved') return false;
      // Check if pass is for today
      if (v.scheduledDate !== today) return false;
      // Check if OTP hasn't expired
      if (v.otpExpiresAt && Date.now() > new Date(v.otpExpiresAt).getTime()) return false;
      return true;
    });
    if (visit) {
      const now = new Date().toISOString();
      await visitStore.updateVisit(visit.id, { status: 'checked_in', checkInTime: now });
      toast({ title: 'Entry Allowed ✓', description: `${visit.visitorName} has been checked in via OTP.` });
      setDirectOtp('');
    } else {
      toast({ title: 'Invalid OTP', description: 'No approved visit found with this OTP, it may have expired, or this pass is not valid for today.', variant: 'destructive' });
    }
  };

  const recentCheckins = visits.filter(v => ['checked_in', 'checked_out', 'denied'].includes(v.status)).slice(0, 8);

  const fmtTime = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout bgImage={bgSecurity}>
      <div className="p-8 lg:p-12 flex-1">
        <h2 className="text-3xl font-medium text-foreground tracking-tight mb-2">Security Gate</h2>
        <p className="text-sm text-muted-foreground mb-10">Scan visitor QR codes and verify OTP for entry.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <ScanLine className="size-5 text-primary" />
              <h3 className="text-lg font-medium text-foreground">QR Scanner</h3>
            </div>

            {/* Camera View */}
            {cameraOpen && (
              <div className="mb-4 relative">
                <div id="qr-reader" className="rounded-xl overflow-hidden" />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 z-20 size-8 rounded-lg bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] block mb-2">Scan QR or Enter Visit ID</label>
                <textarea value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder='Paste QR data or visit ID (e.g. visit-001)' rows={3} className="w-full bg-input rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:bg-secondary focus:shadow-md resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleManualScan} className="flex-1 h-12 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                  Verify QR Code
                </button>
                {!cameraOpen && (
                  <button onClick={startCamera} className="h-12 px-5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors flex items-center gap-2">
                    <Camera className="size-4" /> Open Camera
                  </button>
                )}
              </div>
            </div>

            {scannedVisit && (
              <div className="mt-6 border-t border-border pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-foreground">Visitor Details</h4>
                  <StatusBadge status={scannedVisit.status} />
                </div>
                <DetailRow label="Name" value={scannedVisit.visitorName} />
                <DetailRow label="Company" value={scannedVisit.visitorCompany} />
                <DetailRow label="Host" value={scannedVisit.hostName} />
                <DetailRow label="Purpose" value={scannedVisit.purpose} />
                {scannedVisit.checkInTime && <DetailRow label="In Time" value={fmtTime(scannedVisit.checkInTime)} />}
                {scannedVisit.checkOutTime && <DetailRow label="Out Time" value={fmtTime(scannedVisit.checkOutTime)} />}

                {scannedVisit.status === 'approved' && (
                  <div className="pt-4 space-y-3">
                    <div className="flex gap-3">
                      <button onClick={handleAllowEntry} className="flex-1 h-12 rounded-xl bg-success text-success-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <ShieldCheck className="size-4" /> Allow Entry
                      </button>
                      <button onClick={handleDeny} className="flex-1 h-12 rounded-xl bg-destructive text-destructive-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <ShieldX className="size-4" /> Deny
                      </button>
                    </div>
                  </div>
                )}

                {scannedVisit.status === 'checked_in' && (
                  <div className="pt-4">
                    <button onClick={() => handleCheckOut(scannedVisit)} className="w-full h-12 rounded-xl bg-warning text-warning-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      <LogOut className="size-4" /> Check Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* OTP Direct Entry */}
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <KeyRound className="size-5 text-primary" />
              <h3 className="text-lg font-medium text-foreground">Verify by OTP</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Allow entry using the visitor's 6-digit OTP directly, without scanning QR.</p>
            <div className="space-y-4">
              <input value={directOtp} onChange={e => setDirectOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength={6} className="w-full bg-input rounded-2xl px-5 py-4 text-foreground text-center tracking-[0.3em] text-lg font-bold placeholder:text-muted-foreground/50 outline-none transition-all focus:bg-secondary focus:shadow-md" />
              <button onClick={handleDirectOtp} className="w-full h-12 rounded-xl bg-success text-success-foreground font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <ShieldCheck className="size-4" /> Verify & Allow Entry
              </button>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {recentCheckins.length === 0 && <p className="text-sm text-muted-foreground">No recent check-ins or denials.</p>}
              {recentCheckins.map(visit => (
                <div key={visit.id} className="flex items-center justify-between rounded-xl bg-input p-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{visit.visitorName}</div>
                    <div className="text-xs text-muted-foreground">{visit.visitorCompany} • {visit.hostDepartment}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      In: {fmtTime(visit.checkInTime)} {visit.checkOutTime ? `• Out: ${fmtTime(visit.checkOutTime)}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {visit.status === 'checked_in' && (
                      <button onClick={() => handleCheckOut(visit)} className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning font-semibold hover:bg-warning/20 transition-colors flex items-center gap-1">
                        <LogOut className="size-3" /> Out
                      </button>
                    )}
                    <StatusBadge status={visit.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
