import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

// Log configuration (without exposing the full key)
console.log('🔧 Supabase Config:', {
  url: supabaseUrl ? '✅ URL is set' : '❌ URL is missing',
  key: supabaseAnonKey ? '✅ Key is set' : '❌ Key is missing',
  fullConfig: Constants.expoConfig?.extra
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration is missing. Please check your app.config.ts and environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Types for our database tables
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  barangay: string;
  purok: number;
  account_type: 'Personal' | 'Barangay';
}

export interface Post {
  id: string;
  user_id: string;
  collection_type: string;
  item_list: any;
  post_image: string;
  timestamp: string;
}

export interface Offer {
  id: string;
  post_id: string;
  offered_weight: number;
  requested_weight: number;
  price: number;
  message: string;
  timestamp: string;
} 