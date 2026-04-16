import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { visitStore } from '@/lib/visit-store';
import { StatusBadge } from '@/components/StatusBadge';
import { useState, useEffect, useSyncExternalStore } from 'react';

export default function VisitorPass() {
  const { token } = useParams<{ token: string }>();
  const visits = useSyncExternalStore(visitStore.subscribe, visitStore.getVisits);
  const visit = token ? visitStore.getVisitByToken(token) : undefined;
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!visit) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(visit.otpExpiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [visit]);

  if (!visit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
        <div className="glass rounded-2xl p-12 text-center relative z-10">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Pass Not Found</h1>
          <p className="text-muted-foreground">This pass link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const qrData = JSON.stringify({
    visitId: visit.id,
    timestamp: Date.now(),
    token: visit.secureToken,
  });

  const otpExpired = timeLeft <= 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative p-4">
      <div className="ambient-blob-1" />
      <div className="ambient-blob-2" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-[2rem] p-8 flex flex-col items-center">
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-foreground tracking-tight text-center">
              VisitFlow<span className="text-primary">.</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground text-center">Digital Visitor Pass</p>
          </div>

          {/* QR Code */}
          <div className="my-6 p-6 bg-secondary rounded-2xl">
            <QRCodeSVG
              value={qrData}
              size={200}
              level="H"
              bgColor="transparent"
              fgColor="hsl(215, 28%, 17%)"
            />
          </div>

          {/* OTP */}
          <div className="w-full text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-[2px] text-muted-foreground mb-2">Entry OTP</p>
            <div className="text-4xl font-bold tracking-[0.3em] text-foreground tabular-nums">
              {visit.otp}
            </div>
            <p className={`text-xs mt-2 ${otpExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
              {otpExpired ? 'OTP Expired' : `Expires in ${minutes}:${seconds.toString().padStart(2, '0')}`}
            </p>
          </div>

          {/* Visit Details */}
          <div className="w-full space-y-3 border-t border-border pt-6">
            <DetailRow label="Visitor" value={visit.visitorName} />
            <DetailRow label="Company" value={visit.visitorCompany} />
            <DetailRow label="Host" value={`${visit.hostName} — ${visit.hostDepartment}`} />
            <DetailRow label="Purpose" value={visit.purpose} />
            <DetailRow label="Date & Time" value={`${visit.scheduledDate} at ${visit.scheduledTime}`} />
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              <StatusBadge status={visit.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}
