import { supabase } from './supabase';

interface Offer {
  post_id: string;
  user_id: string;
  offered_items: string[];
  offered_weight: number;
  requested_weight: number;
  price: number;
  message?: string;
  images: string[];
  status?: string;
}

/**
 * Create a new offer
 */
export const createOffer = async (offerData: Offer) => {
  const { error } = await supabase.from('offers').insert([offerData]);

  if (error) {
    console.error("❌ Error submitting offer:", error);
    throw new Error(error.message);
  }

  return { success: true, message: "Offer submitted successfully!" };
};

/**
 * Fetch offers for a specific post
 */
export const getOffersByPost = async (postId: string) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Error fetching offers:", error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * Fetch offers made by a specific user
 */
export const getUserOffers = async (userId: string) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("❌ Error fetching user offers:", error);
    throw new Error(error.message);
  }

  return data;
};
