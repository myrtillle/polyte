import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { notificationService } from './notificationService';
import { Platform } from 'react-native';
// import { Transaction } from '@/app/(tabs)/TransacHist';

type RawTransactionData = {
  id: string;
  user_id: string;
  post_id: string;
  images: string[]; // assuming it's an array of URLs
  offer_schedules: {
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    collection_img: string | null;
  }[];
  posts: {
    collection_modes: {
      name: string;
    };
    personal_users: {
      id: string;
      first_name: string;
      last_name: string;
      purok: number;
      barangay: string;
    };
  };
  personal_users: {
    first_name: string;
    last_name: string;
  };
};

type TransactionDetail = {
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  method: string;
  purok: number;
  barangay: string;
  offerer_id: string;
  collector_id: string;
  offerer_name: string;
  collector_name: string;
  photo_url: string | null;
  proof_image_url: string | null;
};

export type Transaction = {
  id: string;
  offered_items: string[];
  status: string;
  scheduled_date?: string;
  scheduled_time?: string;
};

type OfferWithPostOwner = {
  posts: {
    user_id: string;
  };
};

export const transactionService = {
  
  // fetchTransactionsByStatus: async (status: string) => {
  //   const { data, error } = await supabase
  //     .from('offers')
  //     .select(`
  //       id,
  //       offered_items,
  //       offer_schedules (
  //         scheduled_date,
  //         scheduled_time,
  //         status
  //       )
  //     `)
  //     // .not('offer_schedules', 'is', null); 

  //   if (error) {
  //     console.error('❌ Supabase error:', error.message);
  //     return [];
  //   }

  //   // ✅ Filter and format the data by `offer_schedules.status`
  //   return (data || [])
  //   .filter(item => {
  //     const sched = item.offer_schedules?.[0];
  //     if (!sched) return false;

  //     if (status === 'pending') {
  //       return sched.status === 'pending' || sched.status === 'for_confirmation';
  //     }

  //     return sched.status === status;
  //   })
  //   .map(item => {
  //     const sched = item.offer_schedules?.[0];
  //     return {
  //       id: item.id,
  //       offered_items: item.offered_items,
  //       status: sched.status,
  //       scheduled_date: sched.scheduled_date,
  //       scheduled_time: sched.scheduled_time,
  //     };
  //   });
  // },

  async fetchAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        id,
        offered_items,
        offer_schedules (
          status,
          scheduled_date,
          scheduled_time
        )
      `);
      
      
    if (error) {
      console.error("❌ Failed to fetch transactions:", error.message);
      return [];
    }
  
    return (data || []).map((offer: any) => {
      const schedule = offer.offer_schedules?.[0] || {};
      console.log('📦 Schedule:', schedule);
  
      return {
        id: offer.id,
        offered_items: offer.offered_items || [],
        status: schedule.status || 'unknown',
        scheduled_date: schedule.scheduled_date || '',
        scheduled_time: schedule.scheduled_time || '',
      };
    });
  },

  async fetchTransactionDetails(offerId: string) {
    console.log('📦 fetchTransactionDetails() called with:', offerId);
    console.log('🔎 typeof offerId:', typeof offerId);

    const { data, error } = await supabase
    .from('offers')
    .select(`
      id,
      user_id,
      post_id,
      images,
      offer_schedules (
        scheduled_date,
        scheduled_time,
        status,
        collection_img
      ),
      posts (
        collection_modes:collection_modes!posts_collection_mode_id_fkey (
          name
        ),
        personal_users:personal_users!posts_personal_user_fkey (
          id,
          first_name,
          last_name,
          purok,
          barangay
        )
      ),
      personal_users:personal_users!offers_user_id_fkey (  
        first_name,
        last_name
      )
    `)
    .eq('id', offerId)
    .single<RawTransactionData>();
    
    console.log('✅ Basic offer lookup:', data);
    
    if (error || !data) {
      console.error('❌ Failed to fetch transaction details:', error?.message);
      return null;
    }

    console.log('📦 We have data, continuing flatten:', data);

    const schedule = data.offer_schedules?.[0];
    const post = data.posts;
    const collector = post?.personal_users;
    const collectionMode = post?.collection_modes?.name;
    const offerer = data.personal_users;


    const result: TransactionDetail = {
      scheduled_date: schedule?.scheduled_date,
      scheduled_time: schedule?.scheduled_time,
      status: schedule?.status,
      method: collectionMode || 'Unknown',
      purok: collector?.purok,
      barangay: collector?.barangay,
      offerer_id: data.user_id, // this is the offerer's ID from the offers table
      offerer_name: `${offerer?.first_name ?? ''} ${offerer?.last_name ?? ''}`.trim(),
      collector_id: collector?.id,
      collector_name: `${collector?.first_name ?? ''} ${collector?.last_name ?? ''}`.trim(),
      photo_url: data.images?.[0] || null,
      proof_image_url: schedule?.collection_img || null 
    };

    console.log('✅ Returning flattened transaction result:', result);
    return result;
  },

  async confirmDelivery  (
    offerId: string,
    publicUrl: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('offer_schedules')
        .update({
          status: 'proof_uploaded',
          collection_img: publicUrl,
        })
        .eq('offer_id', offerId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('❌ confirmDelivery error:', err);
      return false;
    }
  },

  uploadProofImage: async (fileUri: string, offerId: string, bucketName: string = 'collection-proofs'): Promise<string | null> => {
    try{
      const fileType = fileUri.split('.').pop();
      const fileName = `image_${Date.now()}.${fileType}`;

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

      fileData = {
        uri: fileUri,
        name: fileName,
        type: `image/${fileType}`,
      };

      const {data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileData);

        if (error) {
          console.error("Error uploading image to Supabase:", error.message);
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Generate public URL for the uploaded image
        const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate the public URL.");
      }

      console.log("Image uploaded successfully:", urlData.publicUrl);

      const { error: updateError } = await supabase
        .from('offer_schedules')
        .update({
          collection_img: urlData.publicUrl,
          status: 'proof_uploaded'
        })
        .eq('offer_id', offerId);
      
      // PO uid (collector)
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('posts(user_id)')
        .eq('id', offerId)
        .single<OfferWithPostOwner>();

      if (offerError || !offer?.posts?.user_id) {
      throw new Error('❌ Could not retrieve post owner info for notification.');
      }

      const poUserId = offer.posts.user_id;

      await notificationService.sendNotification(
        poUserId, 
        'Proof of Collection Uploaded',
        'The offerer has uploaded a proof photo for your review.'
      );
        
      if (updateError) {
        console.error("❌ Failed to update offer_schedules with image + status:", updateError.message);
        throw new Error("Failed to update image and status.");
      }

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Image upload failed:", error.message || "Unknown error");
      throw new Error(error.message || "Unknown error");
    }
  },

  // transactionService.ts
 async markAsPaid(offerId: string): Promise<boolean>{
  try {
    const { error } = await supabase
      .from('offer_schedules')
      .update({ status: 'awaiting_payment' })
      .eq('offer_id', offerId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("❌ markAsPaid error:", err);
    return false;
  }
},

  // uploadProofImage: async (uri: string, bucketName: string = 'collection-proofs'): Promise<string | null> => {
  //   try {
  //     const { data: userData } = await supabase.auth.getUser();
  //     console.log('🧠 User:', userData?.user);
  //     if (!userData?.user) throw new Error('User not authenticated');
  
  //     const fileExt = uri.split('.').pop() || 'jpg';
  //     const fileName = `proof-${Date.now()}.${fileExt}`;
  
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  
  //     console.log('📦 Blob ready:', {
  //       type: blob.type,
  //       size: blob.size,
  //       name: fileName,
  //     });
  
  //     const { data, error } = await supabase.storage
  //       .from('collection-proofs')
  //       .upload(fileName, blob, {
  //         contentType: blob.type || `image/${fileExt}`,
  //         upsert: true,
  //       });
  
  //     if (error) {
  //       console.error('🔥 Upload failed:', error);
  //       throw error;
  //     } else {
  //       console.log('data: ', data);
  //     }
  
  //     const {
  //       data: { publicUrl },
  //     } = supabase.storage.from('collection-proofs').getPublicUrl(fileName);
  
  //     console.log('✅ Uploaded to:', publicUrl);
  //     return publicUrl;
  //   } catch (err) {
  //     console.error('❌ uploadProofImage error:', err);
  //     return null;
  //   }
  // },

  async completeTransaction(offerId: string): Promise<boolean> {
    try { 
      const transaction = await transactionService.fetchTransactionDetails(offerId);
      if (!transaction) throw new Error("Transaction not found");

      const { error } = await supabase
      .from('offer_schedules')
      .update({ status: 'completed' })
      .eq('offer_id', offerId);
    
      if (error) {
        console.error("❌ Failed to mark as completed:", error);
        return false;
      }
  
      await notificationService.sendNotification(
        transaction.offerer_id,
        'Transaction Completed',
        'Your transaction has been marked as completed. Thank you!'
      );
      
      await notificationService.sendNotification(
        transaction.collector_id, // this is usually the post owner
        'Transaction Completed',
        'You’ve successfully completed a transaction. Great job!'
      );
  
      return true;
    } catch (err) {
      console.error("❌ completeTransaction error:", err);
      return false;
    }
   
  }
  
  
}








