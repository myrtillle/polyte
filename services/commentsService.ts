import { supabase } from './supabase';

export const commentsService = {
  /**
   * Fetch comments for a specific post
   * @param postId - The ID of the post
   */
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, user_id, comment_text, created_at, users!inner(username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error.message);
      return [];
    }

    return data.map(comment => ({
      ...comment,
      user_name: comment.users?.[0]?.username || 'Unknown', 
    }));
  },

  /**
   * Add a new comment
   * @param postId - The ID of the post being commented on
   * @param userId - The ID of the user making the comment
   * @param commentText - The comment text
   */
  async addComment(postId: string, userId: string, commentText: string) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, comment_text: commentText }])
      .select();

    if (error) {
      console.error('Error adding comment:', error.message);
      return null;
    }

    return data[0]; // Return the newly inserted comment
  },
};
