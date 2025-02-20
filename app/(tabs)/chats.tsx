import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { ChatRoom, getChatRooms, subscribeToRooms } from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = React.useState<ChatRoom[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadChatRooms = React.useCallback(async () => {
    try {
      const data = await getChatRooms();
      setChatRooms(data);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  React.useEffect(() => {
    if (!session?.user) return;

    const subscription = subscribeToRooms(session.user.id, (room) => {
      setChatRooms(prev => {
        const index = prev.findIndex(r => r.request_id === room.request_id);
        if (index === -1) {
          return [room, ...prev];
        }
        const newRooms = [...prev];
        newRooms[index] = room;
        return newRooms;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatRooms}
        renderItem={({ item: room }) => (
          <Card
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/chat',
                params: { id: room.request_id }
              });
            }}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.roomInfo}>
                <Text variant="titleMedium" numberOfLines={1}>
                  {room.request_title}
                </Text>
                {room.last_message && (
                  <Text 
                    variant="bodyMedium" 
                    numberOfLines={1}
                    style={[
                      styles.lastMessage,
                      room.unread_count > 0 && styles.unreadMessage
                    ]}
                  >
                    {room.last_message.content}
                  </Text>
                )}
              </View>
              {room.unread_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {room.unread_count}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No chats yet</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Help with a request to start chatting
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    marginTop: 4,
    opacity: 0.7,
  },
  unreadMessage: {
    opacity: 1,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
}); 