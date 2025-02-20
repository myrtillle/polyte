export type MessageStatus = 'sent' | 'delivered' | 'read';

export type Message = {
  id: string;
  request_id: string;
  content: string;
  created_at: string;
  sender_id: string;
  status: MessageStatus;
  delivered_at?: string;
  read_at?: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  sender_profile: {
    full_name: string;
    avatar_url?: string;
  };
};

export type ChatRoom = {
  request_id: string;
  request_title: string;
  last_message: Message;
  unread_count: number;
}; 