import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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