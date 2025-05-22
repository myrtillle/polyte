import { NavigatorScreenParams } from '@react-navigation/native';
import { Schedule } from '@/services/offersService';
import { Post } from '@/services/postsService';
import { Offer } from '@/services/offersService';
import { Profile } from '@/services/profileService';
// 🧱 Reusable types
// export interface Post {
//   id: string;
//   user_id: string;
//   description: string;
//   price: number;
//   kilograms: number;
//   category_id: number;
//   collection_mode_id: number;
//   status: string;
//   created_at: string;
//   photos?: string[];
//   location?: string;
//   user?: {
//     email: string;
//     name: string;
//     barangay: number;
//     purok: string;
//     first_name: string;
//     last_name: string;
//   };
//   category?: {
//     id: number;
//     name: string;
//   };
//   collection_mode?: {
//     id: number;
//     name: string;
//     icon: string;
//   };
//   post_item_types?: Array<{
//     item_types: {
//       id: number;
//       name: string;
//     };
//   }>;
// }

// export interface Schedule {
//   id: string;
//   offer_id: string;
//   status: string;
//   scheduled_date: string;
//   scheduled_time: string;
//   purok: string;
//   barangay: string;
//   photo_url?: string;
//   offerer_name?: string;
//   collector_name?: string;
// }

// export interface Offer {
//   id: string;
//   post_id: string;
//   user_id: string;
//   offered_items: string[];
//   offered_weight: number;
//   requested_weight: number;
//   price: number;
//   message: string;
//   status: string;
//   images: string[];
//   created_at: string;
// }

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
};

// ✅ Per-tab stack navigation types
export type HomeStackParamList = {
  HomeMain: undefined;
  ViewPost: { postId?: string; post?: Post };
  MakeOffer: { post: Post };
  Notifications: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  TransacHist: undefined;
  ViewTransaction: { offerId: string };
  Settings: undefined;
  MyPosts: undefined;
  Review: undefined;
  Ratings: { offerId: string };
  TransaCompleted: { weight: number; points: number };
  RedeemRewards: undefined;
  EditProfile: { profile: Profile };
};

export type PostStackParamList = {
  PostMain: undefined;
};

export type MessagesStackParamList = {
  MessagesMain: undefined;
  ChatScreen: {
    chatId: string;
    userId?: string;
    post?: Post;
    schedule?: Schedule;
  };
};

export type BottomTabParamList = {
  Home: undefined;
  Messages: undefined;
  Post: undefined;
  Profile: undefined;
  Leaderboard: undefined;
};

// ✅ RootStack for AppNavigator
export type RootStackParamList = {
  CollectionSchedule: { offerID: string };
  Login: { message: string; } | undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  Main: undefined;
  ConfirmDelivery: {
    scheduleId: string;
    offerId: string;
  };
  EditOffer: { offer: Offer };
  EditPost: { post: Post };
  ScheduleOffer: { offer: Offer; post: Post };
};
