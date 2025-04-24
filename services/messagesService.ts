import { supabase } from './supabase';

export interface Message {
    id: string;
    chat_id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    timestamp: string;
    seen: boolean;
    target_type: string;
    target_id: string;
}
export const messagesService = {
    async fetchUserConversations(userId: string) {
        const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`) // Make sure you have a receiver_id column
        .order('timestamp', { ascending: false });
    
        if (error) {
        console.error("Error fetching conversations:", error);
        return [];
        }
    
        // Group by the other participant
        const latestByUser: Record<string, any> = {};
        
        for (const msg of data) {
        const otherUser = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const isUnread = msg.receiver_id === userId && msg.seen === false;

        if (!latestByUser[otherUser]) {
            latestByUser[otherUser] = msg;
        }
        }
    
        return Object.values(latestByUser);
    },  

    async getUserChats(userId: string) {
        const { data: chats, error } = await supabase
            .from('chats')
            .select('*')
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      
        if (error) throw error;
      
        const previews = [];
      
        for (const chat of chats ?? []) {
          const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('timestamp', { ascending: false })
            .limit(1);

            if (msgError) throw msgError;

            const lastMsg = messages?.[0];
            if (!lastMsg) continue;
      
          if (!lastMsg) continue;
      
          const { data: profile } = await supabase
            .from('personal_users')
            .select('first_name, last_name')
            .eq('id', otherUserId)
            .single();
      
          previews.push({
            chat_id: chat.id,
            otherUserId,
            otherUserName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User',
            lastMessage: lastMsg.message,
            lastTimestamp: lastMsg.timestamp,
            seen: lastMsg.seen && lastMsg.receiver_id === userId,
          });
        }
      
        return previews;
      },         

    async fetchMessages(chatId: string) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('id, chat_id, sender_id, receiver_id, message, seen, timestamp, target_type, target_id')
                .eq('chat_id', chatId)
                .order('timestamp', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
    },

    async sendMessage(
        chatId: string,
        senderId: string,
        receiverId: string,
        message: string,
        targetType?: 'post' | 'schedule',
        targetId?: string
      ) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .insert([
              {
                chat_id: chatId,
                sender_id: senderId,
                receiver_id: receiverId,
                message,
                seen: false,
                target_type: targetType || null,
                target_id: targetId || null,
              },
            ])
            .select()
            .single();
      
          if (error) {
            console.error('❌ Error sending message:', error.message);
            return null;
          }
      
          console.log('✅ Inserted message:', data);
          return data;
        } catch (err) {
          console.error('❌ Caught error sending message:', err);
          return null;
        }
    },      

    async getOrCreateChatId(senderId: string, receiverId: string): Promise<string> {
        // Try to find existing chat
        const { data: existing, error } = await supabase
        .from('chats') // assumes you have a 'chats' table
        .select('id')
        .or(
            `and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`
          )
        .maybeSingle();
    
        if (error) throw error;
    
        if (existing) return existing.id;
    
        // Otherwise, create new chat
        const { data: newChat, error: insertError } = await supabase
        .from('chats')
        .insert({ user1_id: senderId, user2_id: receiverId })
        .select()
        .single();
    
        if (insertError) throw insertError;
        return newChat.id;
    }
      
}

