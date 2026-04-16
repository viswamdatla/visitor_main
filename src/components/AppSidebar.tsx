import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth.tsx';
import {
  LayoutDashboard,
  PlusCircle,
  Shield,
  Settings,
  Users,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Create Pass', path: '/create-pass', icon: PlusCircle },
  { title: 'All Visits', path: '/visits', icon: ClipboardList },
  { title: 'Security Gate', path: '/security', icon: Shield },
  { title: 'Admin Panel', path: '/admin', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const auth = useAuth();
  return (
    <nav className="relative z-10 w-[260px] shrink-0 flex flex-col justify-between p-6 glass-strong">
      <div>
        <Link to="/" className="block mb-12 px-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            VisitFlow<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground mt-1">
            Visitor Management
          </p>
        </Link>

        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'block size-1.5 rounded-full',
                    isActive ? 'bg-primary' : 'bg-transparent'
                  )}
                />
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">Admin</div>
            <div className="text-xs text-muted-foreground truncate">ACS@123</div>
          </div>
        </div>
        <button
          onClick={() => auth.logout()}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
