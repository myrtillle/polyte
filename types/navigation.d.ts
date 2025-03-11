import { Post } from '../app/(tabs)/home'; 

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  ViewPost: { post: Post }; 
  Comment: { post: Post }; 
}; 