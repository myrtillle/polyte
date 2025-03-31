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
  
    // ✅ Update schedule (for rescheduling)
    async updateSchedule(scheduleId: string, date: string, time: string) {
      const { error } = await supabase
        .from('offer_schedules')
        .update({ scheduled_date: date, scheduled_time: time, status: 'rescheduled' })
        .eq('id', scheduleId);
  
      if (error) throw error;
      return { success: true, message: 'Schedule updated successfully!' };
    }
  };