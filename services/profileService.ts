// services/userService.ts
import { supabase } from './supabase';

export const profileService = {
  async fetchCurrentUserDetails() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData?.user) throw new Error('Failed to get user session');
    const userId = sessionData.user.id;

    const { data: userDetails, error: userError } = await supabase
      .from('personal_users')
      .select('id, first_name, last_name, purok, barangay, created_at')
      .eq('id', userId)
      .single();
    if (userError) throw new Error(userError.message);

    const { data: pointsData, error: pointsError } = await supabase
      .from('user_polys')
      .select('points')
      .eq('user_id', userId);
    if (pointsError) throw new Error(pointsError.message);

    const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0);

    return {
      ...userDetails,
      totalPoints,
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
            barangay
        )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedPosts = data.map(post => ({
        ...post,
        user: post.personal_users
            ? { email: post.personal_users.email, name: `${post.personal_users.first_name} ${post.personal_users.last_name}` }
            : null
    }));

    return formattedPosts;
  }, 

  async fetchUserCollection (userId: string) {
    try {
      const { data: collected, error: err1 } = await supabase
        .from('posts')
        .select('kilograms')
        .eq('user_id', userId)
        .eq('category_id', 1); // Seeking For → Collected

      const { data: donated, error: err2 } = await supabase
        .from('posts')
        .select('kilograms')
        .eq('user_id', userId)
        .eq('category_id', 2); // For Collection → Donated

      if (err1 || err2) throw err1 || err2;

      const collectedTotal = collected.reduce((sum, row) => sum + (row.kilograms || 0), 0);
      const donatedTotal = donated.reduce((sum, row) => sum + (row.kilograms || 0), 0);

      return {
        collected: collectedTotal,
        donated: donatedTotal,
      };
    } catch (error) {
      console.error("❌ Failed to fetch collection stats:", error);
      return { collected: 0, donated: 0 };
    }
  }
};
