import { supabase } from './supabase';

export const commentsService = {
  /**
   * Fetch comments for a specific post
   * @param postId - The ID of the post
   */
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, 
        post_id, 
        user_id, 
        comment_text, 
        created_at,
        personal_users:personal_users!comments_user_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
  
    if (error) {
      console.error('❌ Error fetching comments:', error.message);
      return [];
    }
  
    return data.map(comment => {
      const user = Array.isArray(comment.personal_users) ? comment.personal_users[0] : comment.personal_users;
  
      return {
        ...comment,
        user_name: user
          ? `${user.first_name} ${user.last_name}`.trim() || user.email
          : 'Unknown User',
      };
    });
  },  

  /**
   * Add a new comment
   * @param postId - The ID of the post being commented on
   * @param userId - The ID of the user making the comment
   * @param commentText - The comment text
   */
  async addComment(postId: string, userId: string, commentText: string) {
    const { data: userData, error: userError } = await supabase
      .from('personal_users')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single(); // 🔥 Ensures we get only one object, not an array
  
    if (userError) {
      console.error('❌ Error fetching user details:', userError.message);
      return null;
    }
  
    const userName = userData 
      ? `${userData.first_name} ${userData.last_name}`.trim() || userData.email 
      : 'Unknown User';
  
    const { data, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, comment_text: commentText }])
      .select()
      .single(); // 🔥 Also ensure we return a single comment object
  
    if (error) {
      console.error('❌ Error adding comment:', error.message);
      return null;
    }
  
    return {
      ...data,
      user_name: userName, // Attach user details immediately
    };
  }
  
};
