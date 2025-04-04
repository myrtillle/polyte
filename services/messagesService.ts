import { supabase } from './supabase';

export const messagesService = {
    async fetchMessages(chatId: string) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('timestamp', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
    },

    async sendMessage(chatId: string, senderId: string, message: string) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({ chat_id: chatId, sender_id: senderId, message })
                .select();
            if (error) throw error;
            return data?.[0];
        } catch (err) {
            console.error('Error sending message:', err);
            return null;
        }
    }
}

