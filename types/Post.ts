export interface Post {
    id: string;
    user_id: string;
    description: string;
    price: number;
    kilograms: number;
    category_id: number;
    collection_mode_id: number;
    status: string;
    location?: string;
    created_at: string;
    photos?: string[];
    user?: {
      email: string;
      name: string;
      barangay: number;
      purok: string;
      first_name: string;
      last_name: string;
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