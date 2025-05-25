import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MessagesStackParamList, RootStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';
import { messagesService } from '@/services/messagesService';
import { LinearGradient } from 'expo-linear-gradient';
import paperplaneIcon from '../../assets/images/paperplane.png'; // adjust if path is different


type MessagesScreenNavProp = StackNavigationProp<MessagesStackParamList, 'ChatScreen'>;

interface ChatPreview {
  chat_id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastTimestamp: string;
  seen: boolean;
  photo_url?: string; // ✅ Add this
}

export default function MessagesScreen() {
  const navigation = useNavigation<MessagesScreenNavProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
        }
      } catch (err) {
        console.error('❌ Error getting user:', err);
        setError('Failed to get user information. Please check your internet connection.');
      }
    };
    getUser();
  }, []);

  const loadChats = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const previews = await messagesService.getUserChats(userId);
      setConversations(previews);
      console.log("🧪 Chat previews:", previews);

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('❌ Error loading chats:', err);
      setError('Failed to load conversations. Please check your internet connection.');
      
      // Implement retry logic
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(loadChats, 2000); // Retry after 2 seconds
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📡 New message received:', payload);
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const handleChatPress = (chatId: string) => {
    if (!userId) return;
    navigation.navigate('ChatScreen', { chatId, userId });
  };

  const handleLongPress = (chatId: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete messages in the chat
              const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('chat_id', chatId);

              if (messagesError) throw messagesError;

              // Delete the chat
              const { error: chatError } = await supabase
                .from('chats')
                .delete()
                .eq('id', chatId);

              if (chatError) throw chatError;

              // Update local state
              setConversations(prev => prev.filter(chat => chat.chat_id !== chatId));
            } catch (error) {
              console.error('❌ Error deleting conversation:', error);
              Alert.alert(
                "Error",
                "Failed to delete conversation. Please try again."
              );
            }
          }
        }
      ]
    );
  };

  const filtered = conversations.filter((c) =>
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Sticky Full-Width Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
        <View style={styles.titleWithIcon}>
          <Image source={paperplaneIcon} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>MESSAGES</Text>
        </View>
        
      </View>


        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="PLASTIC, OBRERO USEP"
            placeholderTextColor="#AAA"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Messages List */}
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#00D964" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={loadChats}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No Conversations</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.chat_id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.chatCard,
                  !item.seen && styles.unreadChat
                ]} 
                onPress={() => handleChatPress(item.chat_id)}
                onLongPress={() => handleLongPress(item.chat_id)}
                delayLongPress={500}
              >
                <View style={styles.chatRow}>
                  <Image
                    source={{ uri: item.photo_url || `https://i.pravatar.cc/40?u=${item.otherUserId}` }}
                    style={styles.avatar}
                  />
                  <View style={styles.chatTextContainer}>
                    <View style={styles.nameTimeRow}>
                      <Text style={styles.chatName}>{item.otherUserName}</Text>
                      <Text style={styles.chatTime}>
                        {formatTimestamp(item.lastTimestamp)}
                      </Text>
                    </View>
                    <Text 
                      style={[
                        styles.chatMessage,
                        !item.seen && styles.unreadMessage
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  titleWithIcon: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8, // or use marginRight in Image if gap doesn't work
  },

  headerIcon: {
    width: 26,   // ✅ change this to your desired size
    height: 26,
    resizeMode: 'contain',
  },

    chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatTextContainer: {
    flex: 1,
  },

  headerContainer: {
    backgroundColor: '#1A3620',
    paddingHorizontal: 14,
    paddingTop: 24,
    paddingBottom: 16,
   
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
   paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  dots: {
    color: '#fff',
    fontSize: 30,
    letterSpacing: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#132718',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 45,
  },
  searchIcon: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },

  headerBar: {
  backgroundColor: '#1A3620',
  paddingVertical: 10,
  paddingHorizontal: 12,
  flexDirection: 'row', // 🟢 place children side by side
  alignItems: 'center',
  gap: 8,
  
},


  container: {
  flex: 1,
 
  paddingHorizontal: 12,
  paddingTop: 16, // 🔧 Add space below the header (adjust as needed)
},


  chatCard: {
    backgroundColor: '#1E592B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  unreadChat: {
    backgroundColor: '#235F30',
  },
  chatName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  chatMessage: {
    color: '#ccc',
    fontSize: 14,
  },
  chatTime: {
    color: '#aaa',
    fontSize: 12,
  },
  emptyText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadMessage: {
    color: 'white',
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  
  retryButton: {
    backgroundColor: '#00D964',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: '#023F0F',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
