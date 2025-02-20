import { supabase } from './supabase';
import { CreateReviewInput, Review } from '../types/review';

export async function createReview(review: CreateReviewInput) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...review,
      reviewer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

export async function getReviewsByRequestId(requestId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_reviewer_id_fkey(
        full_name,
        avatar_url
      ),
      reviewee:profiles!reviews_reviewee_id_fkey(
        full_name,
        avatar_url
      )
    `)
    .eq('request_id', requestId);

  if (error) throw error;
  return data as (Review & {
    reviewer: { full_name: string; avatar_url?: string };
    reviewee: { full_name: string; avatar_url?: string };
  })[];
} 