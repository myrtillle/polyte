import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Card, Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { getNotifications, markAsRead } from '../../services/notifications';
import { cache } from '../../services/cache';
import { errorHandler } from '../../utils/errorHandler';
import { CachedImage } from '../../components/CachedImage';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../types/notification';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadNotifications = React.useCallback(async (refresh = false) => {
    if (!session?.user) return;

    try {
      setError(null);
      if (refresh) {
        setRefreshing(true);
      }

      // Try cache first if not refreshing
      if (!refresh) {
        const cached = await cache.getCachedData<Notification[]>('notifications');
        if (cached) {
          setNotifications(cached);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const data = await getNotifications(session.user.id);
      setNotifications(data);

      // Cache the result
      await cache.cacheData({
        key: 'notifications',
        data,
        timestamp: Date.now(),
        expiryMinutes: 1, // Cache for 1 minute only since notifications are time-sensitive
      });
    } catch (error) {
      setError(errorHandler.handleError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = React.useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      }

      if (notification.data?.requestId) {
        router.push({
          pathname: '/(tabs)/request-details',
          params: { id: notification.data.requestId }
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error}>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error}
        </Text>
        <Button mode="contained" onPress={handleRefresh}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.content}>
                <Text variant="titleMedium">{item.title}</Text>
                <Text variant="bodyMedium">{item.message}</Text>
                <Text variant="bodySmall" style={styles.timestamp}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No notifications</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              You're all caught up!
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
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  unreadCard: {
    backgroundColor: '#E3F2FD',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  timestamp: {
    marginTop: 4,
    opacity: 0.7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginLeft: 8,
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