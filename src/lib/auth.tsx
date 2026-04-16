import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { visitStore } from './visit-store';

export type UserRole = 'admin' | 'guard' | 'receptionist' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  user: any; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [role, setRole] = useState<UserRole>(null);
  const [user, setUser] = useState<any>(null);

  const fetchUserProfile = async (authUser: any) => {
    try {
      setUser(authUser);
      setIsAuthenticated(true);
      
      // Set a 5-second timeout for profile fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', authUser.id)
          .single();
        
        clearTimeout(timeoutId);
        
        if (data && !error) {
          setRole(data.role as UserRole);
        } else if (error) {
          console.warn("Profile fetch warning:", error);
          // Allow app to load even if profile fetch fails
          setRole(null);
        }
      } catch (queryErr) {
        clearTimeout(timeoutId);
        console.warn("Profile query timeout or error:", queryErr);
        // Continue without role - don't block loading
        setRole(null);
      }
    } catch (err) {
      console.error("Profile resolution error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set timeout for initial session check
    const sessionTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Session check timeout");
        setIsLoading(false);
      }
    }, 8000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        clearTimeout(sessionTimeout);
        if (session?.user) {
          fetchUserProfile(session.user);
          // Initialize visit store when user has existing session
          visitStore.init();
        } else {
          setIsLoading(false);
        }
      }
    }).catch((err) => {
      if (mounted) {
        clearTimeout(sessionTimeout);
        console.error("Session fetch error:", err);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          await fetchUserProfile(session.user);
          // Initialize visit store when user is authenticated
          await visitStore.init();
        } else {
          setIsAuthenticated(false);
          setRole(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setRole(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, role, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
     throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
