import { supabase } from '@/integrations/supabase/client';
import { Visit } from './types';

// Map joined DB row to frontend Visit type
function rowToVisit(row: any): Visit {
  const visitor = row.visitors || {};
  const pass = row.visitor_passes || {};

  let status: Visit['status'] = 'approved';
  if (row.checked_out_at) status = 'checked_out';
  else if (row.checked_in_at) status = 'checked_in';
  else if (pass.status === 'expired' || pass.status === 'revoked') status = 'expired';
  else if (pass.status === 'active') status = 'approved';

  return {
    id: row.id,
    visitorName: visitor.full_name || '',
    visitorCompany: visitor.company || '',
    visitorMobile: visitor.phone || '',
    visitorType: 'visitor',
    purpose: row.purpose || '',
    hostId: '', 
    hostName: visitor.host_name || '',
    hostDepartment: visitor.host_department || '',
    scheduledDate: pass.valid_from ? new Date(pass.valid_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    scheduledTime: '',
    status: status,
    otp: row.notes || pass.otp || '',
    otpExpiresAt: pass.otp_expires_at || '',
    secureToken: pass.qr_code || '',
    checkInTime: row.checked_in_at || undefined,
    checkOutTime: row.checked_out_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

let visits: Visit[] = [];
let listeners: (() => void)[] = [];
let initialized = false;

function notify() {
  listeners.forEach(l => l());
}

async function fetchVisits() {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      id, created_at, checked_in_at, checked_out_at, purpose, pass_id, notes,
      visitors (id, full_name, company, phone, host_name, host_department),
      visitor_passes (id, qr_code, status, valid_from, valid_until, otp, otp_expires_at)
    `)
    .order('created_at', { ascending: false });
    
  if (!error && data) {
    visits = data.map(rowToVisit);
    notify();
  } else if (error) {
    console.error('Error fetching visits:', error);
  }
}

async function init() {
  if (initialized) return;
  initialized = true;
  await fetchVisits();

  // Simple unoptimized real-time listening that refetches everything
  supabase.channel('public:visits')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => fetchVisits())
    .subscribe();
  supabase.channel('public:visitor_passes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_passes' }, () => fetchVisits())
    .subscribe();
}

export const visitStore = {
  init,
  getVisits: () => visits,
  getVisitById: (id: string) => visits.find(v => v.id === id),
  getVisitByToken: (token: string) => visits.find(v => v.secureToken === token),

  addVisit: async (visit: Visit) => {
    // 1. Insert visitor
    const { data: visitorData, error: visitorError } = await supabase
      .from('visitors')
      .insert({
        full_name: visit.visitorName,
        company: visit.visitorCompany,
        phone: visit.visitorMobile,
        host_name: visit.hostName,
        host_department: visit.hostDepartment,
      })
      .select('id').single();

    if (visitorError || !visitorData) {
      console.error('Failed to insert visitor:', visitorError);
      return;
    }

    // 2. Insert pass
    let validFrom = new Date();
    if (visit.scheduledDate) {
      const timeStr = visit.scheduledTime || '09:00';
      // Basic safeguard in case timezone formats disagree
      try {
        const fullDate = new Date(`${visit.scheduledDate}T${timeStr}`);
        if (!isNaN(fullDate.getTime())) validFrom = fullDate;
      } catch (e) {}
    }
    const validUntil = new Date(validFrom);
    validUntil.setHours(23, 59, 59, 999);

    const otpToSave = visit.otp || Math.floor(100000 + Math.random() * 900000).toString();
    const qrCodeToSave = visit.secureToken || crypto.randomUUID().replace(/-/g, '').slice(0, 24);

    const otpExpires = visit.otpExpiresAt || new Date(Date.now() + 600000).toISOString();

    const { data: passData, error: passError } = await supabase
      .from('visitor_passes')
      .insert({
        visitor_id: visitorData.id,
        status: (visit.status === 'pending' || visit.status === 'approved') ? 'active' : 'expired',
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        qr_code: qrCodeToSave,
        otp: otpToSave,
        otp_expires_at: otpExpires,
      })
      .select('id, qr_code').single();

    if (passError || !passData) {
      console.error('Failed to insert pass:', passError);
      return;
    }
    
    // 3. Insert visit event
    const { data: visitData, error: visitError } = await supabase
      .from('visits')
      .insert({
        visitor_id: visitorData.id,
        pass_id: passData.id,
        purpose: visit.purpose,
        notes: null, // No longer storing OTP in notes
      })
      .select('id').single();
    
    if (visitError || !visitData) {
      console.error('Failed to insert visit:', visitError);
      return;
    }

    // Refresh visits
    await fetchVisits();
  },

  updateVisit: async (id: string, updates: Partial<Visit>) => {
    // Since UI currently only updates status, check_in_time, check_out_time, we only update `visits` or `visitor_passes`.
    
    if (updates.checkInTime !== undefined || updates.checkOutTime !== undefined) {
      const payload: any = {};
      if (updates.checkInTime) payload.checked_in_at = updates.checkInTime;
      if (updates.checkOutTime) payload.checked_out_at = updates.checkOutTime;
      
      const { error } = await supabase.from('visits').update(payload).eq('id', id);
      if (error) console.error('Error updating visit check times:', error);
    }
    
    if (updates.status === 'expired' || updates.status === 'denied') {
      const existing = await supabase.from('visits').select('pass_id').eq('id', id).single();
      if (existing.data?.pass_id) {
        await supabase.from('visitor_passes').update({ status: 'expired' }).eq('id', existing.data.pass_id);
      }
    }
    
    await fetchVisits();
  },

  subscribe: (listener: () => void) => {
    listeners.push(listener);
    init();
    return () => { Object.is(listeners = listeners.filter(l => l !== listener), []); };
  },

  getStats: () => {
    const today = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.scheduledDate === today);
    return {
      totalVisitorsToday: todayVisits.filter(v => v.visitorType === 'visitor').length,
      totalVendorsToday: todayVisits.filter(v => v.visitorType === 'vendor').length,
      activePasses: todayVisits.filter(v => ['approved', 'checked_in'].includes(v.status)).length,
      checkedInToday: todayVisits.filter(v => v.status === 'checked_in').length,
      checkedOutToday: todayVisits.filter(v => v.status === 'checked_out').length,
    };
  },
};
