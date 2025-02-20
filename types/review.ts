export type Review = {
  id: string;
  request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_profile?: {
    full_name: string;
    avatar_url?: string;
  };
};

export type CreateReviewInput = Omit<Review, 'id' | 'created_at'>; 