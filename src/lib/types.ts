export type VisitStatus = 'pending' | 'approved' | 'checked_in' | 'checked_out' | 'expired' | 'denied';
export type VisitorType = 'visitor' | 'vendor';
export type UserRole = 'employee' | 'security' | 'admin';

export interface Employee {
  id: string;
  name: string;
  department: string;
  mobile: string;
  email: string;
}

export interface Visit {
  id: string;
  visitorName: string;
  visitorCompany: string;
  visitorMobile: string;
  visitorType: VisitorType;
  purpose: string;
  hostId: string;
  hostName: string;
  hostDepartment: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  otp: string;
  otpExpiresAt: string;
  secureToken: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalVisitorsToday: number;
  totalVendorsToday: number;
  activePasses: number;
  checkedInToday: number;
  checkedOutToday: number;
}
