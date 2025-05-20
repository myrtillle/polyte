import { supabase } from './supabase';

export const rewardsService = {
  fetchPolyPoints: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_polys')
      .select('points')
      .eq('user_id', userId)
      .single();

    if (error) return 0;
    return data?.points || 0;
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

  submitClaim: async (userId: string, rewardId: string) => {
    const { error } = await supabase.from('reward_claims').insert({
      user_id: userId,
      reward_id: rewardId,
      status: 'pending',
    });

    if (error) throw new Error(error.message);
  },

  fetchClaimHistory: async (userId: string) => {
    const { data, error } = await supabase
      .from('reward_claims')
      .select('*, rewards ( reward_name )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data || []).map((row) => ({
      id: row.id,
      reward_name: row.rewards?.reward_name || 'Unknown',
      status: row.status,
    }));
  },
};
