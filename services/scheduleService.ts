import { supabase } from './supabase';

export const scheduleService = {
    // ✅ Create schedule when post owner accepts an offer
    async createSchedule(offerId: string, postId: string, userId: string, date: string, time: string) {
      const { error } = await supabase.from('offer_schedules').insert([
        {
          offer_id: offerId,
          post_id: postId,
          user_id: userId,
          scheduled_date: date,
          scheduled_time: time,
          status: 'pending'
        }
      ]);
      if (error) throw error;
      return { success: true, message: 'Schedule created successfully!' };
    },
  
    // ✅ Fetch schedule for a specific offer
    async getScheduleByOffer(offerId: string) {
      const { data, error } = await supabase
        .from('offer_schedules')
        .select('*')
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
  }
}