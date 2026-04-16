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
      
      // Initialize visit store when user is authenticated
      visitStore.init();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authUser.id)
        .single();
        
      if (data && !error) {
        setRole(data.role as UserRole);
      }
    } catch (err) {
      console.error("Profile resolution error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Auth session error:", err);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (!user || user.id !== session.user.id) {
           await fetchUserProfile(session.user);
        }
      } else {
        setIsAuthenticated(false);
        setRole(null);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
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
    // Immediately clear the auth state
    setIsAuthenticated(false);
    setRole(null);
    setUser(null);
    setIsLoading(false);
    
    // Sign out in the background without blocking
    try {
      // Add a timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, the user is already logged out on the frontend
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
