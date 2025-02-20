export type NotificationType = 
  | 'request_help'
  | 'request_complete'
  | 'chat_message'
  | 'review';

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    requestId?: string;
    reviewId?: string;
  };
  read: boolean;
  created_at: string;
}; 