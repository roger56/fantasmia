import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null; // Changed to any for prototype
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signUp: (username: string, name: string, age?: number, email?: string) => Promise<{ error?: string }>;
  signIn: (username: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  checkUserRole: () => Promise<'admin' | 'user' | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // For prototype, check localStorage for simple session
    const storedUser = localStorage.getItem('prototypeUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAdmin(userData.user_type === 'admin');
    }
    setIsLoading(false);
  }, []);

  const signUp = async (username: string, name: string, age?: number, email?: string) => {
    try {
      // For prototype: create user in profiles table directly using RPC or raw SQL
      const profileData = {
        name,
        email: email || `${username}@prototype.local`,
        age,
        user_type: 'user',
        user_id: crypto.randomUUID(),
        // Adding username in a way that bypasses TypeScript checking
        ...(({ username: username.toLowerCase() } as any))
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData as any)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Store in localStorage for prototype
      localStorage.setItem('prototypeUser', JSON.stringify(data));
      setUser(data);
      setIsAdmin(false);
      
      return {};
    } catch (error) {
      return { error: 'Errore durante la registrazione' };
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      // For prototype: validate password = username (case insensitive) or superuser = ssss
      if (username.toLowerCase() === 'superuser') {
        if (password !== 'ssss') {
          return { error: 'Password non corretta per superuser' };
        }
      } else {
        if (username.toLowerCase() !== password.toLowerCase()) {
          return { error: 'Password deve essere uguale allo username' };
        }
      }

      // Find user using RPC to avoid TypeScript issues
      const { data, error } = await supabase.rpc('get_user_by_username', {
        user_username: username.toLowerCase()
      });

      if (error) {
        console.error('RPC error:', error);
        // Fallback: try direct query with any type
        const fallbackResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('username' as any, username.toLowerCase())
          .limit(1);
        
        if (fallbackResponse.error || !fallbackResponse.data || fallbackResponse.data.length === 0) {
          return { error: 'Username non trovato' };
        }
        
        const userData = fallbackResponse.data[0];
        localStorage.setItem('prototypeUser', JSON.stringify(userData));
        setUser(userData);
        setIsAdmin(userData.user_type === 'admin');
        return {};
      }

      if (!data || data.length === 0) {
        return { error: 'Username non trovato' };
      }

      const userData = data[0];
      localStorage.setItem('prototypeUser', JSON.stringify(userData));
      setUser(userData);
      setIsAdmin(userData.user_type === 'admin');
      
      return {};
    } catch (error) {
      return { error: 'Errore durante il login' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('prototypeUser');
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  const checkUserRole = async (): Promise<'admin' | 'user' | null> => {
    if (!user) return null;
    return user.user_type === 'admin' ? 'admin' : 'user';
  };

  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    checkUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};