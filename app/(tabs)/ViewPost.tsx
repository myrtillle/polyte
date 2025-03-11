// ViewPostScreen.tsx
import React,  { useState, useEffect }  from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView  } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Button, Divider, IconButton } from 'react-native-paper';
import { commentsService } from '../../services/commentsService';
import { supabase } from '../../services/supabase';

type viewPostRouteProp = RouteProp<RootStackParamList, 'ViewPost'>;
type viewPostNavigationProp = StackNavigationProp<RootStackParamList, 'ViewPost'>;

type Props = {
  route: viewPostRouteProp;
  navigation: viewPostNavigationProp;
};

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
}

const ViewPost = () => {
  const route = useRoute<viewPostRouteProp>();
  const navigation = useNavigation<viewPostNavigationProp>();
  const post = route?.params?.post ?? null;
  
  const [activeTab, setActiveTab] = useState('post');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>No post data available.</Text>
      </View>
    );
  }

  const fetchComments = async () => {
    if (!post?.id) return;
    try {
      console.log('🔄 Fetching comments for post ID:', post.id);
      const data = await commentsService.getComments(post.id);
      console.log('📌 Fetched Comments:', JSON.stringify(data, null, 2)); // Logs comments
      setComments(data);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
    }
  };  

  const handleSendComment = async () => {
    console.log("🔍 Debugging handleSendComment:");
  console.log("➡️ commentText:", commentText);
  console.log("➡️ post.id:", post?.id);
  console.log("➡️ currentUser.id:", currentUser?.id);
    if (!commentText.trim() || !post?.id || !currentUser?.id) {
      console.warn("⚠️ Cannot send comment: Missing data!");
      return;
    }
    
    try {
      console.log("📨 Sending comment:", commentText);
  
      const newComment = await commentsService.addComment(post.id, currentUser.id, commentText);
  
      if (newComment) {
        console.log("✅ Comment Posted:", JSON.stringify(newComment, null, 2));
        fetchComments(); // Reload comments
        setCommentText('');
      }
    } catch (error) {
      console.error("❌ Error posting comment:", error);
    }
  };  
   

  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  
  useEffect(() => {
    if (post?.id) {
      fetchComments();
    }
    console.log('ViewPost Route:', route);
    console.log('ViewPost Route Params:', route?.params);
  
    console.log('📌 Post Data:', JSON.stringify(post, null, 2));
  }, [post]);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('❌ Error fetching user:', error.message);
      } else {
        console.log("✅ Fetched User:", JSON.stringify(data.user, null, 2));
        setCurrentUser(data.user); // ✅ Ensure this updates
      }
    };
  
    getUser();
  }, []);
  
  console.log('ViewPost Post Object:', post);

  return (
    <View style={styles.container}> 
      {/* Back Button */}
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      />

      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setActiveTab('post')} style={[styles.tab, activeTab === 'post' && styles.activeTab]}>
          <Text style={styles.tabText}>POST</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('offers')} style={[styles.tab, activeTab === 'offers' && styles.activeTab]}>
          <Text style={styles.tabText}>OFFERS</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'post' ? (
        <ScrollView style={styles.content}>
          {/* User Info */}
          <View style={styles.userInfo}>
            {/* <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.avatar} /> */}
            <Image source={{ uri: 'https://i.pravatar.cc/40' }} style={styles.avatar} />

            <View>
              <Text style={styles.userName}>{post.user?.name}</Text>
              <Text style={styles.userLocation}>📍 {post.user?.barangay}, Purok {post.user?.purok}</Text>
            </View>
            <Text style={styles.timeAgo}>⏳ {post.created_at}</Text>
          </View>

          {/* Post Description */}
          <Text style={styles.description}>{post.description}</Text>

          {/* Item Types */}
          <Text style={styles.itemTypes}>🛍 Items: {post.post_item_types?.map(item => item.item_types.name).join(', ')}</Text>

          {/* Post Image */}
          {post.photos && post.photos.length > 0 && (
            <Image source={{ uri: post.photos[0] }} style={styles.postImage} />
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button mode="contained" style={styles.actionButton}>Send Message</Button>
            <Button mode="contained" style={styles.actionButton}>Send Offer</Button>
            <TouchableOpacity style={styles.moreOptions}>
              <Text style={styles.moreOptionsText}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <Divider style={styles.divider} />
          <Text style={styles.commentsHeader}>Comments</Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet.</Text>
          ) : (
            comments.map((comment, index) => (
              <View key={index} style={styles.comment}>
                <Text style={styles.commentUser}>{comment.user_name}:</Text>
                <Text style={styles.commentText}>{comment.comment_text}</Text>
              </View>
            ))
          )}

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity onPress={() => {
              console.log("📝 Comment button clicked!"); // Check if button is registering clicks
              handleSendComment();
            }} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>📩</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyTab}>
          <Text>No offers yet.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#122C0F' 
  },
  backButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 10, 
    backgroundColor: '#1E5128' 
  },
  tab: { 
    padding: 10, 
    borderRadius: 5 
  },
  activeTab: { 
    borderBottomWidth: 2, 
    borderBottomColor: 'white' 
  },
  tabText: { 
    color: 'white', 
    fontSize: 16 
  },
  content: { 
    padding: 15 
  },
  userInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
  },
  userName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white' 
  },
  userLocation: { 
    fontSize: 14, 
    color: 'gray' 
  },
  timeAgo: { 
    marginLeft: 'auto', 
    fontSize: 12, 
    color: 'gray' 
  },
  description: { 
    fontSize: 16, 
    color: 'white', 
    marginBottom: 5 
  },
  itemTypes: { 
    fontSize: 14, 
    color: 'lightgray', 
    marginBottom: 10 
  },
  postImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 10, 
    marginBottom: 10 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 10 
  },
  actionButton: { 
    flex: 1, 
    marginHorizontal: 5 
  },
  moreOptions: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 10 
  },
  moreOptionsText: { 
    fontSize: 24, 
    color: 'white' 
  },
  divider: { 
    backgroundColor: 'gray', 
    height: 1, 
    marginVertical: 10 
  },
  commentsHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 5 
  },
  noComments: { 
    fontSize: 14, 
    color: 'gray', 
    textAlign: 'center' 
  },
  comment: { 
    flexDirection: 'row', 
    marginBottom: 5 
  },
  commentUser: { 
    fontWeight: 'bold', 
    color: 'white', 
    marginRight: 5 
  },
  commentText: { 
    color: 'white' 
  },
  commentInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    backgroundColor: '#1E5128', 
    borderRadius: 20 
  },
  commentInput: { 
    flex: 1, 
    color: 'white', 
    padding: 10 
  },
  sendButton: { 
    padding: 10 
  },
  sendButtonText: { 
    fontSize: 18, 
    color: 'white' 
  },
  emptyTab: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});

export default ViewPost;
