import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
}

type RawFetchedPost = Post & {
  post_user?: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    purok: string;
    barangay: string;
  };
};

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
  photos?: string[];
  location?: string;

  // Fetched via join from personal_users
  user?: {
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    barangay: string;
    purok: string;
    username: string;
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
    id: number;
    name: string;
  }>;
}

// New interface for creating a post
export interface CreatePostData {
  user_id: string;
  category_id: number;
  item_type_ids: number[];
  description: string;
  kilograms: number;
  collection_mode_id: number;
  status: string;
  photos: string[];
  location: string;
  price: number;
}

export const postsService = {
  // async getPosts() {
  //   const { data: posts, error: postsError } = await supabase
  //     .from('posts')
  //     .select(`
  //       *,
  //       category:categories!posts_category_id_fkey (
  //         id,
  //         name
  //       ),
  //       collection_mode:collection_modes!posts_collection_mode_id_fkey (
  //         id,
  //         name,
  //         icon
  //       ),
  //       post_item_types (
  //         item_types (
  //           id,
  //           name
  //         )
  //       ),
  //       personal_users (
  //         id,
  //         email,
  //         first_name,
  //         last_name,
  //         purok,
  //         barangay
  //       )
  //     `)
  //     .eq('status', 'active')
  //     .order('created_at', { ascending: false });

  //   if (postsError) throw postsError;
    
  //   const formattedPosts = posts.map(post => ({
  //     ...post,
  //     user: post.personal_users
  //       ? { email: post.personal_users.email, name: `${post.personal_users.first_name} ${post.personal_users.last_name}` }
  //       : null
  //   }));
  
  //   return formattedPosts;
  // }, 
  
  // for home screen
  async getPosts() {
    const { data, error } = await supabase.rpc('get_active_posts');
    if (error) throw error;
  
    const posts = (data ?? []) as RawFetchedPost[];
  
    return posts.map((post) => ({
      ...post,
      user: post.post_user
        ? {
            username: post.post_user.username ?? '',
            email: post.post_user.email,
            first_name: post.post_user.first_name ?? '',
            last_name: post.post_user.last_name ?? '',
            full_name: `${post.post_user.first_name ?? ''} ${post.post_user.last_name ?? ''}`.trim(),
            barangay: post.post_user.barangay ?? '',
            purok: post.post_user.purok ?? '',
          }
        : undefined,
    }));
  },
  
  async getPostById(postId: string) {
    const { data, error } = await supabase.rpc('get_post_by_id_with_location', { pid: postId });
    if (error) throw error;
  
    const post = ((data ?? [])[0] ?? null) as RawFetchedPost;
  
    return {
      ...post,
      user: post.post_user
        ? {
            username: post.post_user.username ?? '',
            email: post.post_user.email,
            first_name: post.post_user.first_name ?? '',
            last_name: post.post_user.last_name ?? '',
            full_name: `${post.post_user.first_name ?? ''} ${post.post_user.last_name ?? ''}`.trim(),
            barangay: post.post_user.barangay ?? '',
            purok: post.post_user.purok ?? '',
          }
        : undefined,
    } as Post;
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
        price: postData.price ?? null
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
        const response = await fetch(fileUri);
        const blob = await response.blob();
        fileData = blob;
      } else {
        fileData = {
          uri: fileUri,
          name: fileName,
          type: `image/${fileType}`,
        };
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileData);

      if (error) {
        console.error("Error uploading image to Supabase:", error.message);
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate the public URL.");
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Image upload failed:", error.message || "Unknown error");
      throw new Error(error.message || "Unknown error");
    }
  },

  // Add validation function
  validatePostData(postData: CreatePostData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!postData.category_id) errors.push('Category is required');
    if (!postData.collection_mode_id) errors.push('Collection mode is required');
    if (!postData.item_type_ids || postData.item_type_ids.length < 2) {
      errors.push('Please select at least 2 types of plastics');
    }
    if (!postData.description?.trim()) errors.push('Description is required');
    if (!postData.kilograms || postData.kilograms <= 0) {
      errors.push('Please enter a valid weight in kilograms');
    }
    if (!postData.location) errors.push('Location is required');
    
    // Photos validation
    if (!postData.photos || postData.photos.length === 0) {
      errors.push('At least one photo is required');
    } else if (postData.photos.length > 5) {
      errors.push('Maximum 5 photos allowed');
    }

    // Price validation for selling category
    if (postData.category_id === 2) { // Assuming 2 is the ID for selling category
      if (!postData.price || postData.price <= 0) {
        errors.push('Please enter a valid price');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },
 
  // async getUserPosts(userId: string) {
  //   const { data, error } = await supabase
  //     .from('posts')
  //     .select(`
  //       *, 
  //     `)
  //     .eq('user_id', userId)
  //     .order('created_at', { ascending: false });

  //   if (error) throw error;
  //   return data;
  // },
  async getUserPosts(userId: string) {
    const { data, error } = await supabase
      .rpc('get_user_posts_with_location', { uid: userId });
  
    if (error) throw error;
    return data;
  },
  
  //unused
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

  // async getPostById(postId: string) {
  //   const { data: post, error } = await supabase
  //     .from('posts')
  //     .select(`
  //       *,
  //       category:categories!posts_category_id_fkey (
  //         id,
  //         name
  //       ),
  //       collection_mode:collection_modes!posts_collection_mode_id_fkey (
  //         id,
  //         name,
  //         icon
  //       ),
  //       post_item_types (
  //         item_types (
  //           id,
  //           name
  //         )
  //       ),
  //       personal_users (
  //         id,
  //         email,
  //         first_name,
  //         last_name,
  //         purok,
  //         barangay
  //       )
  //     `)
  //     .eq('id', postId)
  //     .single();
  
  //   if (error) throw error;
    
  //   console.log("✅ Fetch Result from Supabase:", post);
    
  //   return {
  //     ...post,
  //     user: post.personal_users
  //       ? { email: post.personal_users.email, name: `${post.personal_users.first_name} ${post.personal_users.last_name}` }
  //       : null
  //   };
  // },

  
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