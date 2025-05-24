import { supabase } from './supabase';
import { postsService } from './postsService';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';


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
  post_item_types?: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  personal_users?: {
    first_name: string;
    last_name: string;
  }
}

export interface Schedule {
  id: string;
  offer_id: string;
  status: string;
  scheduled_time: string;
  scheduled_date: string;
  collectorName: string;
  offererName: string;
  photoUrl: string | '';
  purok: string;
  barangay: string;
  user_id: string; 
  photo_url?: string;
  offerer_name?: string;
  collector_name?: string;
}

export const createOffer = async (offerData: Offer) => {
  const { error } = await supabase.from('offers').insert([offerData]);

  if (error) {
    console.error("❌ Error submitting offer:", error);
    throw new Error(error.message);
  }

  return { success: true, message: "Offer submitted successfully!" };
};

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

export const updateOffer = async (offer: Partial<Offer>) => { 
  if (!offer.id) {
    console.error("❌ Error: Offer ID is required for updating.");
    return false;
  }

  try {
    // const { error } = await supabase
    //   .from('offers')
    //   .update({
    //     offered_items: offer.offered_items,
    //     price: offer.price,
    //     offered_weight: offer.offered_weight,
    //     message: offer.message,       
    //     images: offer.images,
    //   })
    //   .eq('id', offer.id);
    const { error } = await supabase
    .from('offers')
    .update(offer)
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
  async uploadImage(fileUri: string, bucketName: string = 'offers') {
    try {
      const fileType = fileUri.split('.').pop();
      const fileName = `image_${uuidv4()}.${fileType}`;

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

  async getOfferSchedule(offerId: string) {
    try {
        const { data, error } = await supabase
            .from('offer_schedules')
            .select('id, offer_id, status, scheduled_time, scheduled_date, post_id, user_id, offer_id')
            .eq('offer_id', offerId)
            .single();
  
        if (error) throw error;
  
        // Fetch related user data (collector and offerer)
        const postDetails = await postsService.getPostById(data.post_id);
        const collectorName = `${postDetails.user?.first_name ?? ''} ${postDetails.user?.last_name ?? ''}`.trim() || 'Unknown'
        const photoUrl = postDetails.photos?.[0] ?? '';
  
        return {
            id: data.id,
            offer_id: data.offer_id,
            status: data.status,
            scheduled_time: data.scheduled_time,
            scheduled_date: data.scheduled_date,
            collectorName,
            offererName: `${postDetails.user?.first_name ?? ''} ${postDetails.user?.last_name ?? ''}`.trim() || 'Unknown',
            photoUrl,
            purok: postDetails.user?.purok?? 'Unknown',
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
  },

  async getOffererId (offerId: string) {
    const { data, error } = await supabase
      .from('offers')
      .select('user_id')
      .eq('id', offerId)
      .maybeSingle();
  
    if (error || !data) {
      console.error("❌ Error fetching offerer ID:", error);
      throw error; 
    }
  
    return data.user_id;
  }
  
}

