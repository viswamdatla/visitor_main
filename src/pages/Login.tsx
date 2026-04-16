import { useState } from 'react';
import { useAuth } from '@/lib/auth.tsx';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck } from 'lucide-react';
import loginBg from '@/assets/login-bg.jpg';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { success, error } = await login(username, password);
    setLoading(false);
    
    if (!success) {
      toast({ 
        title: 'Sign In Failed', 
        description: error || 'Please check your credentials.', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0 bg-background/30" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            VisitFlow<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground mt-1">
            Visitor Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 flex flex-col gap-5">
          <div className="flex justify-center mb-2">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="size-7 text-primary" />
            </div>
          </div>

          <h2 className="text-lg font-medium text-foreground text-center">Sign In</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] pl-4">
              Email
            </label>
            <input
              type="email"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter email address"
              required
              className="w-full bg-input rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:bg-secondary focus:shadow-md"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-[2px] pl-4">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full bg-input rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:bg-secondary focus:shadow-md"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            {!loading && <span className="block size-1.5 rounded-full bg-primary animate-pulse" />}
          </button>

          <p className="text-[10px] text-muted-foreground text-center mt-4 tracking-wide">
            Secured by <span className="font-semibold text-foreground">ACS Technologies Limited</span>
          </p>
        </form>
      </div>
    </div>
  );
}
