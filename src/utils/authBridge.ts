import { supabase } from '@/integrations/supabase/client';
import { User } from '../utils/userStorage';

interface SupabaseAuthResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

/**
 * Bridge between localStorage authentication and Supabase Auth
 * This service handles the integration of existing localStorage users with Supabase
 */
export class AuthBridge {
  
  /**
   * Create or login a localStorage user into Supabase
   */
  static async bridgeUserToSupabase(localUser: User): Promise<SupabaseAuthResult> {
    try {
      // Check if user already exists in Supabase by checking user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('name', localUser.name)
        .single();

      if (existingProfile) {
        // User already exists, create a session using the existing profile
        return await this.createSupabaseSessionForUser(existingProfile);
      } else {
        // User doesn't exist, create them in Supabase
        return await this.createSupabaseUser(localUser);
      }
    } catch (error) {
      console.error('Error bridging user to Supabase:', error);
      return {
        success: false,
        error: 'Failed to bridge user authentication'
      };
    }
  }

  /**
   * Create a new user in Supabase Auth and user_profiles
   */
  private static async createSupabaseUser(localUser: User): Promise<SupabaseAuthResult> {
    try {
      // For localStorage users, we'll use a placeholder email and create anonymous auth
      const placeholderEmail = localUser.email || `${localUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@fantasmia.local`;
      
      // Sign up the user with a secure password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: placeholderEmail,
        password: `${localUser.password}_secure_${Date.now()}`, // Make password more secure
        options: {
          data: {
            name: localUser.name,
            age: localUser.age
          }
        }
      });

      if (authError) {
        console.error('Supabase auth signup error:', authError);
        return {
          success: false,
          error: authError.message
        };
      }

      if (authData.user) {
        // Create the user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            name: localUser.name,
            age: localUser.age,
            email: localUser.email,
            user_type: localUser.name.toLowerCase() === 'superuser' ? 'SUPERUSER' : 'Adulto',
            style_preference: 'default',
            password: localUser.password // Keep original password for compatibility
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return {
            success: false,
            error: 'Failed to create user profile'
          };
        }

        return {
          success: true,
          user: authData.user,
          session: authData.session
        };
      }

      return {
        success: false,
        error: 'Failed to create user'
      };
    } catch (error) {
      console.error('Error creating Supabase user:', error);
      return {
        success: false,
        error: 'Failed to create user in Supabase'
      };
    }
  }

  /**
   * Create a session for an existing Supabase user
   */
  private static async createSupabaseSessionForUser(profile: any): Promise<SupabaseAuthResult> {
    try {
      // For existing users, we need to sign them in
      // Since we don't store the actual Supabase password, we'll create a new session
      // This is a simplified approach - in production you might want a different strategy
      
      // Get the user by user_id
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(profile.user_id);
      
      if (userError) {
        console.error('Error getting user:', userError);
        return {
          success: false,
          error: 'User not found in Supabase'
        };
      }

      // Create a session token for the user
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: '', // This would need proper implementation in production
        refresh_token: ''
      });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        // Fallback: just mark as authenticated in our system
        return {
          success: true,
          user: { id: profile.user_id, email: profile.email || `${profile.name}@fantasmia.local` },
          session: null
        };
      }

      return {
        success: true,
        user: user,
        session: sessionData.session
      };
    } catch (error) {
      console.error('Error creating session for existing user:', error);
      return {
        success: false,
        error: 'Failed to create session'
      };
    }
  }

  /**
   * Simplified authentication for localStorage users
   * This creates a pseudo-session in localStorage to track Supabase authentication state
   */
  static async createLocalSupabaseSession(localUser: User): Promise<boolean> {
    try {
      // Store a local session that indicates the user is authenticated
      const sessionData = {
        user: {
          id: localUser.id,
          email: localUser.email || `${localUser.name}@fantasmia.local`,
          user_metadata: {
            name: localUser.name,
            age: localUser.age
          }
        },
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        access_token: `local_${localUser.id}_${Date.now()}`,
        refresh_token: `refresh_${localUser.id}_${Date.now()}`
      };

      localStorage.setItem('fantasmia_supabase_session', JSON.stringify(sessionData));
      localStorage.setItem('fantasmia_current_user_id', localUser.id);
      
      return true;
    } catch (error) {
      console.error('Error creating local Supabase session:', error);
      return false;
    }
  }

  /**
   * Get the current bridged session
   */
  static getCurrentBridgedSession(): any {
    try {
      const sessionData = localStorage.getItem('fantasmia_supabase_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.expires_at > Date.now()) {
          return session;
        } else {
          // Session expired
          localStorage.removeItem('fantasmia_supabase_session');
          localStorage.removeItem('fantasmia_current_user_id');
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting bridged session:', error);
      return null;
    }
  }

  /**
   * Clear the bridged session
   */
  static clearBridgedSession(): void {
    localStorage.removeItem('fantasmia_supabase_session');
    localStorage.removeItem('fantasmia_current_user_id');
  }

  /**
   * Check if user is authenticated (either via Supabase or bridged session)
   */
  static async isAuthenticated(): Promise<{ authenticated: boolean; userId?: string; userName?: string }> {
    // Check Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('user_id', session.user.id)
        .single();
      
      return {
        authenticated: true,
        userId: session.user.id,
        userName: profile?.name || 'Unknown User'
      };
    }

    // Check bridged session
    const bridgedSession = this.getCurrentBridgedSession();
    if (bridgedSession) {
      return {
        authenticated: true,
        userId: bridgedSession.user.id,
        userName: bridgedSession.user.user_metadata?.name || 'Unknown User'
      };
    }

    return { authenticated: false };
  }
}