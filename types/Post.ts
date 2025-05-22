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
  // updated_at: string;
  photos?: string[];
  location?: string;
  personal_users?: {
    email: string;
    first_name: string;
    last_name: string;
    purok: string;
    barangay: string;
  };
  users?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      first_name?: string;
      last_name?: string;
      username?: string;
      name?: string;
    };
    barangays?: { name?: string };
    puroks?: { name?: string };
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
    item_types: {
      id: number;
      name: string;
    };
  }>;
} 