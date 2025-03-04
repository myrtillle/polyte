import { Post } from "@/app/(tabs)/home";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  PostDetail: { postId: string };
  Options: { post: Post };
  Test: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Post: undefined;
  Messages: undefined;
  Profile: undefined;
}; 