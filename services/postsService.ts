import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Post {
  id: string;
  user_id: string;
  description: string;
  kilograms: number;
  category_id: number;
  collection_mode_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  photos?: string[];
  location?: string;
  users?: {
    id: string; 
    email: string;
    raw_user_meta_data?: {
      username?: string;
      first_name?: string;
      last_name?: string;
    };
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
  location: string; 
}

export const postsService = {
  async getPosts() {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
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
        ),
        post_item_types (
          item_types (
            id,
            name
          )
        ),
        personal_users (
          id,
          email,
          first_name,
          last_name,
          purok,
          barangay
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;
    
    const formattedPosts = posts.map(post => ({
      ...post,
      user: post.personal_users
        ? { email: post.personal_users.email, name: `${post.personal_users.first_name} ${post.personal_users.last_name}` }
        : null
    }));
  
    return formattedPosts;
  }, 

  async createPost(postData: CreatePostData) {
    const { item_type_ids, photos, ...post } = postData;

    // Create the post
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert([{
        ...post,
        collection_mode_id: post.collection_mode_id,
        category_id: post.category_id,
        status: 'active',
        photos: postData.photos, 
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

    console.log("Photos before submission (should be an array):", Array.isArray(postData.photos), postData.photos);

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

  async uploadImage(fileUri: string, bucketName: string = 'images') {
    try {
      const fileType = fileUri.split('.').pop();
      const fileName = `image_${Date.now()}.${fileType}`;

      console.log("📷 filename:", fileName);

      let fileData: any;
      if (Platform.OS === 'web') {
        // Web-specific handling
        const response = await fetch(fileUri);
        const blob = await response.blob();
        fileData = blob;
      } else {
        // Android and iOS handling
        fileData = {
          uri: fileUri,
          name: fileName,
          type: `image/${fileType}`,
        };
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileData);

        console.log("📷 data:", data);
      if (error) {
        console.error("Error uploading image to Supabase:", error.message);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

        console.log("📷 publicURL:", fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate the public URL.");
      }

      console.log("Image uploaded successfully:", urlData.publicUrl);

      console.log("📷 URL:", urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Image upload failed:", error.message || "Unknown error");
      throw new Error(error.message || "Unknown error");
    }
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

  async getPostById(postId: string) {
    const { data: post, error } = await supabase
      .from('posts')
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
        ),
        post_item_types (
          item_types (
            id,
            name
          )
        ),
        personal_users (
          id,
          email,
          first_name,
          last_name,
          purok,
          barangay
        )
      `)
      .eq('id', postId)
      .single();
  
    if (error) throw error;
    
    console.log("✅ Fetch Result from Supabase:", post);
    
    return {
      ...post,
      user: post.personal_users
        ? { email: post.personal_users.email, name: `${post.personal_users.first_name} ${post.personal_users.last_name}` }
        : null
    };
  },

  async updatePost (postId: string, postData: any) {
    const { item_type_ids, ...postFields } = postData;

    // Update main post
    const { error: updateError } = await supabase
      .from('posts')
      .update(postFields)
      .eq('id', postId);
    if (updateError) throw updateError;
  
    // Remove existing item types
    await supabase.from('post_item_types').delete().eq('post_id', postId);
  
    // Add new ones
    const inserts = item_type_ids.map((id: number) => ({
      post_id: postId,
      item_type_id: id,
    }));
  
    const { error: insertError } = await supabase
      .from('post_item_types')
      .insert(inserts);
  
    if (insertError) throw insertError;  
  },

  async deletePost (postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  },

}; 