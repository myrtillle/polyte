import { supabase } from './supabase';
import { notificationService } from './notificationService';

export const scheduleService = {
    // Create schedule when post owner accepts an offer
    async createSchedule(offerId: string, postId: string, offererId: string, collectorId: string, date: string, time: string) {
      const { data: offer, error: offerError } = await supabase.from('offer_schedules').insert([
        {
          offer_id: offerId,
          post_id: postId,
          offerer_id: offererId,
          collector_id: collectorId,
          scheduled_date: date,
          scheduled_time: time,
          status: 'pending'
        }
      ])
      .select()
      .single();

      if (offerError) throw offerError;

      
      return { success: true, message: 'Schedule created successfully!' };
    },
  
    // ✅ Fetch schedule for a specific offer
    async getScheduleByOffer(offerId: string) {
      const { data, error } = await supabase
        .from('offer_schedules')
        .select(`
          *,
          posts(
            category_id
          ),
          offers(
            *,
            buyer:buyer_id (
              username,
              id,
              email,
              first_name,
              last_name,
              profile_photo_url
            ),
            seller:seller_id (
              username,
              id,
              email,
              first_name,
              last_name,
              profile_photo_url
            )
          )
        `)
        .eq('offer_id', offerId)
        .single();
  
      if (error) throw error;
      return data;
    },

    // async updateSchedule(scheduleId: string, date: string, time: string) {
    //   const { error } = await supabase
    //     .from('offer_schedules')
    //     .update({ scheduled_date: date, scheduled_time: time, status: 'rescheduled' })
    //     .eq('id', scheduleId);
  
    //   if (error) throw error;
    //   return { success: true, message: 'Schedule updated successfully!' };
    // }

    async updateSchedule(offerId: string, newTime: string, newDate: string) {
      try {
        const { error } = await supabase
            .from('schedules')
            .update({ scheduled_time: newTime, scheduled_date: newDate })
            .eq('offer_id', offerId);
        if (error) throw error;
        console.log('Schedule updated successfully');
      } catch (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }
    },

    async cancelSchedule(offerId: string) {
      try {
          const { error } = await supabase
              .from('schedules')
              .delete()
              .eq('offer_id', offerId);
          if (error) throw error;
          console.log('Schedule cancelled successfully');
      } catch (error) {
          console.error('Error cancelling schedule:', error);
          throw error;
      }
    },

    async agreeToSchedule(offerId: string): Promise<boolean> {
      const { error } = await supabase
        .from('offer_schedules')
        .update({ status: 'for_collection' })
        .eq('offer_id', offerId);
    
      if (error) {
        console.error("❌ Failed to agree to schedule:", error.message);
        return false;
      }
    
      return true;
    }
    
}