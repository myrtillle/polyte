// import { Post } from "@/app/(tabs)/home";
import { Offer } from '../services/offersService'
import { Schedule } from '../app/(tabs)/CollectionSchedule'
 
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Leaderboard: undefined;
  ViewPost: { post: Post };
  MakeOffer: {post: Post };
  EditOffer: { offer: Offer };
  ScheduleOffer: { offer: Offer; post: Post };
  CollectionSchedule: { offerID: string }; 
  ChatScreen: { 
    chatId: string; 
    userId?: string; post?: 
    Post; schedule?: Schedule 
  };
  TransacHist: undefined;
  ViewTransaction: { offerId: string };
  ConfirmDelivery: {
    offerId: string;
    offererName: string;
    collectorName: string;
    photoUrl: string;
  };
  MyPosts: undefined;
  Review: undefined;
  Notifications: { onViewed?: () => void } | undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Post: undefined;
  Messages: { userId: string }; 
  Profile: undefined;
};

export interface Post {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  photos?: string[];
  location?: string;
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

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
};

export type PostType = {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  photos?: string[];
  user?: {
    email: string;
    name: string;
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

export type ConfirmDeliveryParams = {
  offerId: string;
  offererName: string;
  collectorName: string;
  photoUrl: string;
};
