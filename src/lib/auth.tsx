import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();
        
      if (data && !error) {
        setRole(data.role as UserRole);
      }
      
      setUser(authUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Profile resolution error:", err);
      // Even if role fetch fails, we still consider them structurally logged in depending on requirements,
      // but if we want to block them we'd do something else here.
      setUser(authUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("AuthContext: setting up onAuthStateChange...");
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("onAuthStateChange fired with event:", event);
      if (session?.user) {
        console.log("onAuthStateChange: user found, calling fetchUserProfile...");
        // DO NOT await here. Awaiting Supabase DB queries inside onAuthStateChange 
        // causes a lock deadlock because Supabase holds the JS lock while emitting.
        fetchUserProfile(session.user);
      } else {
        console.log("onAuthStateChange: no user session, setting states to null/false...");
        setIsAuthenticated(false);
        setRole(null);
        setUser(null);
        setIsLoading(false);
      }
    });
    console.log("AuthContext: onAuthStateChange setup complete.");

    // Fallback: If onAuthStateChange didn't fire for some reason, we avoid an infinite loading spinner.
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      console.log("AuthContext: cleaning up auth listener...");
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
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
