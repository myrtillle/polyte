import { supabase } from './supabase';

export type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  completed_requests: number;
  average_rating: number;
};

export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    limit_count: limit,
  });

  if (error) throw error;
  return data as LeaderboardEntry[];
} 