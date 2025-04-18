import { supabase } from './supabase';

export const notificationService = {
  async sendNotification(userId: string, title: string, message: string) {
    const { error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, title, message }]);

    if (error) throw error;
  },

  async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
  
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id') // fetch minimal field
          .eq('user_id', userId)
          .eq('is_read', false);
    
        if (error) {
          console.error('❌ Still failed to fetch unread count:', error.message);
          return 0;
        }
    
        return data.length;
      } catch (e) {
        console.error('❌ Unexpected error:', e);
        return 0;
      }
  }
  
  
};
