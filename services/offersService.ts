import { supabase } from './supabase';
import { postsService } from './postsService';

export interface Offer {
  id: string;
  post_id: string;
  user_id: string;
  offered_items: string[];
  offered_weight: number;
  requested_weight: number;
  price: number;
  message?: string;
  images: string[];
  status?: string;
  post_item_types?: Array<{ // ✅ Add this property
    item_types: {
      id: number;
      name: string;
    };
  }>;
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
    .select(`
      *,
      personal_users (
        id,
        email,
        first_name,
        last_name
      )
    `)
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

export const updateOffer = async (offer: Offer) => { 
  if (!offer.id) {
    console.error("❌ Error: Offer ID is required for updating.");
    return false;
  }

  try {
    const { error } = await supabase
      .from('offers')
      .update({
        offered_items: offer.offered_items,
        price: offer.price,
        offered_weight: offer.offered_weight,
        message: offer.message,       
        images: offer.images,
      })
      .eq('id', offer.id);

    if (error) {
      console.error("❌ Error updating offer:", error.message);
      return false;
    }

    console.log("✅ Offer updated successfully:", offer);
    return true;
  } catch (error) {
    console.error("❌ Unexpected error updating offer:", error);
    return false;
  }
};

export const offersService = {
  async getOfferSchedule(offerId: string) {
    try {
        const { data, error } = await supabase
            .from('offer_schedules')
            .select('status, scheduled_time, scheduled_date, post_id, user_id, offer_id')
            .eq('offer_id', offerId)
            .single();
  
        if (error) throw error;
  
        // Fetch related user data (collector and offerer)
        const postDetails = await postsService.getPostById(data.post_id);
        const collectorName = postDetails.user?.name ?? 'Unknown';
        const photoUrl = postDetails.photos?.[0] ?? '';
  
        return {
            status: data.status,
            scheduled_time: data.scheduled_time,
            scheduled_date: data.scheduled_date,
            collectorName,
            offererName: postDetails.user?.name ?? 'Unknown',
            photoUrl,
            purok: postDetails.user?.purok ?? 'Unknown',
            barangay: postDetails.user?.barangay ?? 'Unknown',
            user_id: data.user_id,
        };
    } catch (error) {
        console.error("Error fetching offer schedule:", error);
        throw error;
    }
  },

  async cancelSchedule(offerId: string) {
    try {
        const { error } = await supabase
            .from('offer_schedules')
            .update({ status: 'cancelled' })
            .eq('offer_id', offerId);

        if (error) throw error;

        console.log("Schedule successfully cancelled.");
        return true;
    } catch (error) {
        console.error("Error cancelling schedule:", error);
        throw error;
    }
  }
}

