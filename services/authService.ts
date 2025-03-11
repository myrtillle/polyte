import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

interface SignUpResponse {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: AuthError | null;
}

export const authService = {
  async signUp(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    barangay?: string;
    purok?: string;
    account_type: 'personal' | 'barangay';
  }): Promise<SignUpResponse> {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            barangay: data.barangay,
            purok: data.purok,
            account_type: data.account_type
          }
        }
      });

      if (authError) throw authError;

      // Then, create the user profile based on account type
      if (authData.user) {
        if (data.account_type === 'personal') {
          const { error: profileError } = await supabase
            .from('personal_users')
            .insert([{
              id: authData.user.id,
              first_name: data.first_name,
              last_name: data.last_name,
              username: data.username,
              email: data.email,
              barangay: data.barangay,
              purok: data.purok,
              account_type: data.account_type,
            }]);
          if (profileError) throw profileError;
        } else if (data.account_type === 'barangay') {
          const { error: profileError } = await supabase
            .from('barangay_users')
            .insert([{
              id: authData.user.id,
              email: data.email,
              barangay: data.barangay,
              purok: data.purok,
              account_type: data.account_type,
            }]);
          if (profileError) throw profileError;
        }
      }

      return { data: authData, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: null, error: error as AuthError | null };
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Check for email confirmation error - update this to match Supabase's exact error message
    if (error?.message?.toLowerCase().includes('email not confirmed') || 
        error?.message?.toLowerCase().includes('email confirmation')) {
      return {
        data: null,
        error: new Error('Please confirm your email before logging in.')
      };
    }

    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user;
  },

  async getUserProfile(userId: string) {
    const { data: userProfile, error } = await supabase
      .from('personal_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      const { data: barangayProfile, error: barangayError } = await supabase
        .from('barangay_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (barangayError) throw barangayError;
      return barangayProfile; // Return barangay profile if found
    }

    if (error) throw error;
    return userProfile; // Return personal profile if found
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup', // ✅ Use "signup" for email confirmation resend
      email,
    });
    
    return { error };
  }
};