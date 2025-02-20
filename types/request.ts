export type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type RequestImage = {
  url: string;
  width: number;
  height: number;
};

export type RequestCategory = 
  | 'plastic'
  | 'paper'
  | 'metal'
  | 'glass'
  | 'electronics'
  | 'other';

export type Request = {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  reward_points: number;
  status: RequestStatus;
  created_at: string;
  created_by: string;
  assigned_to?: string;
  completed_at?: string;
  image_url?: string;
  images: RequestImage[];
  categories: RequestCategory[];
};

export type CreateRequestInput = {
  title: string;
  description: string;
  reward_points: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  category: string;
  image_url?: string;
  images?: string[];
}; 