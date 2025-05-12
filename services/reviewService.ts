import { supabase } from './supabase';

interface ReviewInput {
  offer_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string;
}

export const reviewService = {
  submitReview: async (review: ReviewInput) => {
    const { error } = await supabase.from('reviews').insert([review]);
    if (error) {
      console.error('❌ Failed to submit review:', error.message);
      return false;
    }
    return true;
  }
};
