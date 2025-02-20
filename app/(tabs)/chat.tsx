import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View, Image } from 'react-native';
import { ActivityIndicator, Avatar, IconButton, Text, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Message, getMessages, sendMessage, subscribeToMessages, markMessagesAsDelivered } from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const flatListRef = React.useRef<FlatList>(null);

  const loadMessages = React.useCallback(async () => {
    if (!params.id) return;
    try {
      const data = await getMessages(params.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  React.useEffect(() => {
    if (!params.id || !session?.user) return;

    const subscription = subscribeToMessages(params.id, (message) => {
      setMessages(prev => [...prev, message]);
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [params.id, session?.user]);

  React.useEffect(() => {
    if (!params.id) return;
    markMessagesAsDelivered(params.id);
  }, [params.id]);

  const handleSend = async () => {
    if (!params.id || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      const message = await sendMessage(params.id || '', newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const file = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || 'image/jpeg',
          name: result.assets[0].uri.split('/').pop() || 'image.jpg',
        };

        setSending(true);
        await sendMessage(params.id || '', '', file);
        setSending(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item: message }) => (
          <View
            style={[
              styles.messageContainer,
              message.sender_id === session?.user?.id && styles.ownMessage
            ]}
          >
            {message.sender_id !== session?.user?.id && (
              <Avatar.Text
                size={32}
                label={message.sender_profile.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
                style={styles.avatar}
              />
            )}
            <View
              style={[
                styles.messageBubble,
                message.sender_id === session?.user?.id && styles.ownMessageBubble
              ]}
            >
              <Text style={styles.messageText}>{message.content}</Text>
              {message.attachment_url && message.attachment_type === 'image' && (
                <Image
                  source={{ uri: message.attachment_url }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              )}
              {message.attachment_url && message.attachment_type === 'file' && (
                <View style={styles.fileAttachment}>
                  <IconButton icon="file" size={24} />
                  <Text>Attachment</Text>
                </View>
              )}
              <View style={styles.messageFooter}>
                <Text style={styles.timestamp}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                {message.sender_id === session?.user?.id && (
                  <View style={styles.statusContainer}>
                    {message.status === 'sent' && (
                      <Ionicons name="checkmark" size={16} color="#9E9E9E" />
                    )}
                    {message.status === 'delivered' && (
                      <Ionicons name="checkmark-done" size={16} color="#9E9E9E" />
                    )}
                    {message.status === 'read' && (
                      <Ionicons name="checkmark-done" size={16} color="#2196F3" />
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No messages yet</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Start the conversation
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <IconButton
          icon="attachment"
          size={24}
          onPress={handleAttachment}
          disabled={sending}
        />
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
          disabled={sending}
          right={
            <TextInput.Icon
              icon="send"
              disabled={!newMessage.trim() || sending}
              onPress={handleSend}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
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
  messageList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  ownMessage: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: 8,
    marginLeft: 8,
  },
  messageBubble: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 16,
    maxWidth: '70%',
    borderTopLeftRadius: 4,
  },
  ownMessageBubble: {
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'white',
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
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  statusContainer: {
    marginLeft: 4,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
}); 