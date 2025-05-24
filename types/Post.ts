export interface Post {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  price: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  photos?: string[];
  location?: string;
  views?: number;
  offers_count?: number;
  comments_count?: number;
  last_activity?: string;

  // Fetched via join from personal_users
  user?: {
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    barangay: string;
    purok: string;
    username: string;
    profile_photo_url: string;
  };

  category?: {
    id: number;
    name: string;
  };

  collection_mode?: {
    id: number;
    name: string;
    icon: string;
  };

  post_item_types?: Array<{
    id: number;
    name: string;
  }>;
}