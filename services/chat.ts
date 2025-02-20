import { supabase } from './supabase';
import { createNotification } from './notifications';
import { Message, MessageStatus, ChatRoom } from '../types/chat';
import { cache } from './cache';
import { errorHandler } from '../utils/errorHandler';

export async function uploadAttachment(
  file: { uri: string; type: string; name: string },
  requestId: string
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${requestId}/${user.id}/${Date.now()}.${fileExt}`;
  const filePath = `chat-attachments/${fileName}`;

  // Convert uri to blob
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, blob);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    type: file.type.startsWith('image/') ? 'image' : 'file',
  };
}

async function uploadFile(attachment: { uri: string; type: string; name: string }) {
  // Convert uri to blob
  const response = await fetch(attachment.uri);
  const blob = await response.blob();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const fileName = `${user.id}/${Date.now()}_${attachment.name}`;
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(fileName, blob);

  if (error) throw error;
  return data.path;
}

export async function sendMessage(
  requestId: string,
  content: string,
  attachment?: { uri: string; type: string; name: string }
): Promise<Message> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    let attachment_url: string | undefined;
    let attachment_type: 'image' | 'file' | undefined;

    if (attachment) {
      attachment_url = await uploadFile(attachment);
      attachment_type = attachment.type.startsWith('image/') ? 'image' : 'file';
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        request_id: requestId,
        content,
        sender_id: user.id,
        status: 'sent',
        attachment_url,
        attachment_type,
      })
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Format message data
    const message: Message = {
      ...data,
      sender_profile: {
        full_name: data.sender_profile[0].full_name,
        avatar_url: data.sender_profile[0].avatar_url,
      },
    };

    // If offline, cache the message
    if (!navigator.onLine) {
      await cache.addPendingAction({
        type: 'create',
        entity: 'messages',
        data: {
          request_id: requestId,
          content,
          attachment_url,
          attachment_type,
        },
      });
    }

    return message;
  } catch (error) {
    throw errorHandler.handleError(error);
  }
}

export async function getMessages(requestId: string): Promise<Message[]> {
  try {
    // Try cache first
    const cached = await cache.getCachedData<Message[]>(`messages:${requestId}`);
    if (cached && !navigator.onLine) {
      return cached;
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender_profile:profiles!messages_sender_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const messages = data.map(message => ({
      ...message,
      sender_profile: message.sender_profile[0],
    })) as Message[];

    // Cache messages
    await cache.cacheData({
      key: `messages:${requestId}`,
      data: messages,
      timestamp: Date.now(),
      expiryMinutes: 5,
    });

    return messages;
  } catch (error) {
    throw errorHandler.handleError(error);
  }
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    // Try cache first
    const cached = await cache.getCachedData<ChatRoom[]>('chatRooms');
    if (cached && !navigator.onLine) {
      return cached;
    }

    const { data, error } = await supabase
      .from('requests')
      .select(`
        id,
        title,
        messages:messages (
          *,
          sender_profile:profiles!messages_sender_id_fkey (
            full_name,
            avatar_url
          )
        )
      `)
      .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const chatRooms = data
      .filter(request => request.messages.length > 0)
      .map(request => ({
        request_id: request.id,
        request_title: request.title,
        last_message: {
          ...request.messages[0],
          sender_profile: request.messages[0].sender_profile[0],
        } as Message,
        unread_count: request.messages.filter(
          m => m.sender_id !== user.id && m.status !== 'read'
        ).length,
      }));

    // Cache chat rooms
    await cache.cacheData({
      key: 'chatRooms',
      data: chatRooms,
      timestamp: Date.now(),
      expiryMinutes: 1,
    });

    return chatRooms;
  } catch (error) {
    throw errorHandler.handleError(error);
  }
}

export function subscribeToMessages(
  requestId: string,
  callback: (message: Message) => void
) {
  return supabase
    .channel(`messages:${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `request_id=eq.${requestId}`,
      },
      async (payload) => {
        // Get full message data with profile
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            sender_profile:profiles!messages_sender_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const message: Message = {
            ...data,
            sender_profile: {
              full_name: data.sender_profile[0].full_name,
              avatar_url: data.sender_profile[0].avatar_url,
            },
          };
          callback(message);
        }
      }
    )
    .subscribe();
}

export function subscribeToRooms(
  userId: string,
  callback: (room: ChatRoom) => void
) {
  return supabase
    .channel(`rooms:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        // Get room data
        const { data } = await supabase
          .from('requests')
          .select(`
            id,
            title,
            messages (
              *,
              sender_profile:profiles!messages_sender_id_fkey (
                full_name,
                avatar_url
              )
            )
          `)
          .eq('id', payload.new.request_id)
          .single();

        if (data) {
          const message: Message = {
            ...data.messages[0],
            sender_profile: {
              full_name: data.messages[0].sender_profile[0].full_name,
              avatar_url: data.messages[0].sender_profile[0].avatar_url,
            },
          };

          const room: ChatRoom = {
            request_id: data.id,
            request_title: data.title,
            last_message: message,
            unread_count: data.messages.filter(
              m => m.sender_id !== userId && m.status !== 'read'
            ).length,
          };

          callback(room);
        }
      }
    )
    .subscribe();
}

export async function markMessagesAsRead(requestId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  if (error) throw error;
}

export async function markMessagesAsDelivered(requestId: string) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('messages')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .neq('sender_id', user.id)
    .is('delivered_at', null);

  if (error) throw error;
} 