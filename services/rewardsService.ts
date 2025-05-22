import { supabase } from './supabase';
import { notificationService } from './notificationService';

export const rewardsService = {
  fetchPolyPoints: async (userId: string) => {
    console.log('🔍 Fetching available poly points for user:', userId);
  
    // Fetch earned points
    const { data: earned, error: earnedError } = await supabase
      .from('user_polys')
      .select('points')
      .eq('user_id', userId);
  
    if (earnedError) {
      console.error('❌ Error fetching earned points:', earnedError);
      return 0;
    }
  
    const totalEarned = earned?.reduce((sum: number, record: { points: number }) => {
      return sum + (record.points || 0);
    }, 0) || 0;
  
    // Fetch redeemed points
    const { data: redeemed, error: redeemError } = await supabase
      .from('claimed_rewards')
      .select('points_spent')
      .eq('user_id', userId);
  
    if (redeemError) {
      console.error('❌ Error fetching redeemed points:', redeemError);
      return totalEarned; // fallback: show earned only
    }
  
    const totalSpent = redeemed?.reduce((sum: number, record: { points_spent: number }) => {
      return sum + (record.points_spent || 0);
    }, 0) || 0;
  
    const availablePoints = totalEarned - totalSpent;
  
    console.log('✅ Earned:', totalEarned, '| Spent:', totalSpent, '| Available:', availablePoints);
  
    return availablePoints >= 0 ? availablePoints : 0;
  },  

  fetchAvailableRewards: async (userId: string) => {
    const { data: user } = await supabase
      .from('personal_users')
      .select('barangay_id')
      .eq('id', userId)
      .single();

    if (!user?.barangay_id) return [];

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('barangay_id', user.barangay_id);

    return data || [];
  },

  submitClaim: async (
    userId: string,
    rewardId: string,
    rewardPoints: number,
    barangayId?: string
  ) => {
    // First check if user has enough points
    const availablePoints = await rewardsService.fetchPolyPoints(userId);
    if (availablePoints < rewardPoints) {
      throw new Error('Insufficient points');
    }

    const { error } = await supabase.from('claimed_rewards').insert({
      user_id: userId,
      reward_id: rewardId,
      points_spent: rewardPoints,
      barangay_id: barangayId ?? null,
      status: 'pending',
      claimed_at: new Date().toISOString(),
    });
  
    if (error) throw new Error(error.message);
  },  

  fetchClaimHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('claimed_rewards')
      .select(`
        *,
        rewards (
          reward_name,
          reward_description,
          poly_points_required
        )
      `)
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      reward_name: row.rewards?.reward_name || 'Unknown',
      reward_description: row.rewards?.reward_description,
      points_spent: row.points_spent,
      status: row.status,
      claimed_at: row.claimed_at,
    }));
  },

  // Add function to handle reward approval notifications
  async handleRewardApproval(claimId: string) {
    const { data: claim, error: claimError } = await supabase
      .from('claimed_rewards')
      .select(`
        *,
        rewards (
          reward_name
        ),
        personal_users (
          id
        )
      `)
      .eq('id', claimId)
      .single();

    if (claimError) throw claimError;

    // Deduct points only when approved
    const { error: pointsError } = await supabase
      .from('user_polys')
      .insert({
        user_id: claim.personal_users.id,
        points: -claim.points_spent, // Negative points to deduct
        type: 'reward_redemption',
        reference_id: claimId,
        created_at: new Date().toISOString()
      });

    if (pointsError) {
      console.error('Error deducting points:', pointsError);
      throw pointsError;
    }

    // Send notification to user
    await notificationService.sendNotification(
      claim.personal_users.id,
      'Reward Approved! 🎉',
      `Your redemption for "${claim.rewards.reward_name}" has been approved.`,
      'reward_approved',
      {
        type: 'transaction',
        id: claimId
      }
    );
  },

  // Add function to handle reward rejection
  async handleRewardRejection(claimId: string) {
    const { data: claim, error: claimError } = await supabase
      .from('claimed_rewards')
      .select(`
        *,
        rewards (
          reward_name
        ),
        personal_users (
          id
        )
      `)
      .eq('id', claimId)
      .single();

    if (claimError) throw claimError;

    // Send notification to user
    await notificationService.sendNotification(
      claim.personal_users.id,
      'Reward Rejected',
      `Your redemption for "${claim.rewards.reward_name}" has been rejected.`,
      'reward_rejected',
      {
        type: 'transaction',
        id: claimId
      }
    );
  },
};
