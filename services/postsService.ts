import { supabase } from './supabase';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Post {
  id: string;
  user_id: string;
  category_id: number;
  description: string;
  kilograms: number;
  collection_mode_id: number;
  location?: Location;
  photos?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  users?: {
    email: string;
    raw_user_meta_data: {
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    avatar_url?: string;
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

// New interface for creating a post
export interface CreatePostData extends Omit<Post, 'id' | 'created_at' | 'updated_at'> {
  item_type_ids: number[];
}

export const postsService = {
  async getPosts() {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        users:auth.users (
          email,
          raw_user_meta_data,
          avatar_url
        ),
        category:categories (
          id,
          name
        ),
        collection_mode:collection_modes (
          id,
          name,
          icon
        ),
        post_item_types (
          item_types (
            id,
            name
          )
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;
    return posts;
  },

  async createPost(postData: CreatePostData) {
    const { item_type_ids, ...post } = postData;

    // Create the post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert([{
        ...post,
        collection_mode_id: post.collection_mode_id,
        category_id: post.category_id,
        status: 'active'
      }])
      .select(`
        *,
        category:categories!posts_category_id_fkey (
          id,
          name
        ),
        collection_mode:collection_modes!posts_collection_mode_id_fkey (
          id,
          name,
          icon
        )
      `)
      .single();

    if (postError) {
      console.error('Error creating post:', postError);
      throw postError;
    }

    // Create item type relationships
    if (item_type_ids && item_type_ids.length > 0) {
      const { error: typesError } = await supabase
        .from('post_item_types')
        .insert(
          item_type_ids.map(typeId => ({
            post_id: newPost.id,
            item_type_id: typeId
          }))
        );

      if (typesError) {
        console.error('Error creating item type relationships:', typesError);
        throw typesError;
      }
    }

    return newPost;
  },

  async uploadPhoto(file: any) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('post-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('post-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async getUserPosts(userId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Add methods to fetch categories and item types
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getItemTypes() {
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getCollectionModes() {
    const { data, error } = await supabase
      .from('collection_modes')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  },

  async getPostById(id: string) {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:auth.users (
          email,
          raw_user_meta_data,
          avatar_url
        ),
        category:categories (
          id,
          name
        ),
        collection_mode:collection_modes (
          id,
          name,
          icon
        ),
        post_item_types (
          item_types (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return post;
  }
}; 