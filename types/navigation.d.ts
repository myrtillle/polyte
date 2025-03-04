import { Post } from '../app/(tabs)/home'; // Ensure this path is correct

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  PostDetail: { postId: string }; // Ensure this is defined correctly
  Options: { post: Post }; // Ensure this is defined correctly
}; 