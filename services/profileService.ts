// services/userService.ts
import { supabase } from './supabase';

type OfferScheduleWithPost = {
  post_id: string;
  status: string;
  posts: {
    user_id: string;
    kilograms: number;
  } | { user_id: string; kilograms: number }[]; // handle both object and array
};


export const profileService = {
  async fetchCurrentUserDetails() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) throw new Error('Failed to get user session');
    const userId = sessionData.user.id;

    const { data: userDetails, error: userError } = await supabase
      .from('personal_users')
      .select(`
        id, 
        first_name, 
        last_name, 
        purok, 
        barangays (name), 
        created_at`)
      .eq('id', userId)
      .single();
    if (userError) throw new Error(userError.message);

    const { data: pointsData, error: pointsError } = await supabase
      .from('user_polys')
      .select('points')
      .eq('user_id', userId);
    if (pointsError) throw new Error(pointsError.message);

    const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0);

    // Fetch average rating
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
      barangay: userDetails.barangays?.[0]?.name ?? '',
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
  }
  
};
