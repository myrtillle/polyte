import { supabase } from './supabase';
import { Request } from './requests';

export type Favorite = {
  id: string;
  user_id: string;
  request_id: string;
  created_at: string;
  request: Request;
};

type GetFavoritesOptions = {
  limit?: number;
  offset?: number;
};

export async function getFavorites(options: GetFavoritesOptions = {}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const query = supabase
    .from('favorites')
    .select(`
      *,
      request:requests (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query.limit(options.limit);
  }
  if (typeof options.offset === 'number') {
    query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Favorite[];
}

export async function addFavorite(requestId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      request_id: requestId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFavorite(requestId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('request_id', requestId);

  if (error) throw error;
}

export async function isFavorite(requestId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
} 