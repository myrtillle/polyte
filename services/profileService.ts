// services/userService.ts
import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as ImagePicker from 'expo-image-picker';

type OfferScheduleWithPost = {
  post_id: string;
  status: string;
  posts: {
    user_id: string;
    kilograms: number;
  } | { user_id: string; kilograms: number }[]; // handle both object and array
};

// types/Profile.ts
export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_photo_url: string | null;
  barangay_id: number | null;
  purok_id: number | null;
  created_at: string;
}

interface UserDetails extends Profile {
  barangays: { name: string } | null;
  puroks: { purok_name: string } | null;
}

export const profileService = {
  async fetchCurrentUserDetails() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) throw new Error('Failed to get user session');
    const userId = sessionData.user.id;
  
    console.log('🔍 Fetching user details for ID:', userId);
  
    // 🔹 Fetch personal profile
    const { data: userDetails, error: userError } = await supabase
      .from('personal_users')
      .select(`
        id, 
        first_name, 
        last_name, 
        email,
        profile_photo_url,
        barangay_id,
        purok_id,
        created_at,
        barangays!barangay_id (name),
        puroks!purok_id (purok_name)
      `)
      .eq('id', userId)
      .single<UserDetails>();
  
    if (userError) {
      console.error('❌ Error fetching user details:', userError);
      throw new Error(userError.message);
    }
  
    console.log('✅ User details fetched:', {
      id: userDetails.id,
      name: `${userDetails.first_name} ${userDetails.last_name}`,
      photoUrl: userDetails.profile_photo_url
    });
  
    // 🔹 Fetch total earned points
    const { data: earned, error: earnedError } = await supabase
      .from('user_polys')
      .select('points')
      .eq('user_id', userId);
  
    const totalEarned = earned?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;
    if (earnedError) throw new Error(earnedError.message);
  
    // 🔹 Fetch total redeemed points
    const { data: redeemed, error: redeemError } = await supabase
      .from('claimed_rewards')
      .select('points_spent')
      .eq('user_id', userId);
  
    const totalSpent = redeemed?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
    if (redeemError) throw new Error(redeemError.message);
  
    const totalPoints = Math.max(totalEarned - totalSpent, 0);
  
    // 🔹 Fetch average rating
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_user_id', userId);
  
    if (reviewsError) throw new Error(reviewsError.message);
  
    const averageRating = reviewsData?.length
      ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
      : 0;
  
    return {
      ...userDetails,
      barangay: userDetails.barangays?.name ?? '',
      purok: userDetails.puroks?.purok_name ?? '',
      totalPoints,
      averageRating,
    };
  },  

  async getMyPosts() {
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) throw new Error('User not found');
    const userId = session.user.id;

    const { data, error } = await supabase
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
            barangays ( name )
        )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedPosts = data.map(post => ({
        ...post,
        user: post.personal_users
          ? {
              email: post.personal_users.email,
              name: `${post.personal_users.first_name ?? ''} ${post.personal_users.last_name ?? ''}`,
              barangay: post.personal_users.barangays?.[0]?.name ?? '',
              purok: post.personal_users.purok ?? '',
              first_name: post.personal_users.first_name ?? '',
              last_name: post.personal_users.last_name ?? '',
            }
          : undefined,
    }));

    return formattedPosts;
  }, 

  async fetchUserCollection(userId: string) {
    try {
      // Step 1: Get completed schedules joined with post weights where the user is the offerer
      const { data, error } = await supabase
        .from('offer_schedules')
        .select(`
          id,
          status,
          post_id,
          posts (kilograms, user_id)
        `)
        .eq('status', 'completed');
  
      if (error) throw error;
  
      let donatedTotal = 0;
  
      (data as OfferScheduleWithPost[])?.forEach((schedule) => {
        const post = Array.isArray(schedule.posts) ? schedule.posts[0] : schedule.posts;
      
        if (post?.user_id === userId) {
          donatedTotal += post.kilograms || 0;
        }
      });      
  
      // Optionally, still calculate collectedTotal (if needed)
      // In this example, we just return 0 unless you want to apply the same logic for collectors
  
      return {
        collected: 0,
        donated: donatedTotal,
      };
    } catch (error) {
      console.error("❌ Failed to fetch accurate donation stats:", error);
      return { collected: 0, donated: 0 };
    }
  },

  async updateProfile(id: string, payload: {
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_photo_url?: string;
    barangay_id?: number | null;
    purok_id?: number | null;
  }) {
    const { error } = await supabase
      .from('personal_users')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  },

  async uploadImage(fileUri: string, bucketName: string = 'profile-photos') {
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

  async fetchBarangays() {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async fetchPuroks() {
    const { data, error } = await supabase
      .from('puroks')
      .select('id, purok_name')
      .order('purok_name');
    
    if (error) throw error;
    return data || [];
  },
};
