import { supabase } from './supabase';
import { Message } from '@/app/(tabs)/ChatScreen';

export const messagesService = {

    async fetchUserConversations (userId: string) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('timestamp', { ascending: false });
    
        if (error) throw error;
    
        const latestByChat = Object.values(
          data.reduce((acc, msg) => {
            if (!acc[msg.chat_id]) acc[msg.chat_id] = msg;
            return acc;
          }, {} as { [chat_id: string]: Message })
        );
    
        return latestByChat;
    },

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

    async sendMessage(chatId: string, senderId: string, receiverId: string, message: string) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                      chat_id: chatId,
                      sender_id: senderId,
                      receiver_id: receiverId, 
                      message: message,
                    },
                ])
                .select()
                // .maybeSingle(); 
            if (error) throw error;
            console.log('message: ', message);
            return data?.[0];
            
        } catch (err) {
            console.error('Error sending message:', err);
            return null;
        }
    }
}

