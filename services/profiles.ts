import { supabase } from './supabase';
import { Review } from '../types/review';

export type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  user_type: 'personal' | 'business' | 'barangay';
  created_at: string;
};

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase.rpc('get_user_stats', {
    user_id: userId,
  });

  if (error) throw error;
  return data as {
    total_points: number;
    completed_requests: number;
    average_rating: number;
  };
}

export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(
        full_name,
        avatar_url
      ),
      request:requests(
        title
      )
    `)
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as (Review & {
    reviewer: { full_name: string; avatar_url?: string };
    request: { title: string };
  })[];
} 