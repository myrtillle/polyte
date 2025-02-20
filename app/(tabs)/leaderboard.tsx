import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Card, Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { getLeaderboard } from '../../services/leaderboard';
import { cache } from '../../services/cache';
import { errorHandler } from '../../utils/errorHandler';
import { CachedImage } from '../../components/CachedImage';

type LeaderboardEntry = {
  id: string;
  full_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadLeaderboard = React.useCallback(async (refresh = false) => {
    try {
      setError(null);
      if (refresh) {
        setRefreshing(true);
      }

      // Try cache first if not refreshing
      if (!refresh) {
        const cached = await cache.getCachedData<LeaderboardEntry[]>('leaderboard');
        if (cached) {
          setEntries(cached);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const data = await getLeaderboard();

      // Add rank to entries
      const rankedData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setEntries(rankedData);

      // Cache the result
      await cache.cacheData({
        key: 'leaderboard',
        data: rankedData,
        timestamp: Date.now(),
        expiryMinutes: 5,
      });
    } catch (error) {
      setError(errorHandler.handleError(error, {
        retry: () => loadLeaderboard(refresh),
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleRefresh = React.useCallback(() => {
    loadLeaderboard(true);
  }, [loadLeaderboard]);

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
          {error.message}
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
        data={entries}
        renderItem={({ item }) => (
          <Card 
            style={styles.card}
            onPress={() => router.push(`/profile/${item.id}`)}
          >
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.rank}>
                #{item.rank}
              </Text>
              {item.avatar_url ? (
                <CachedImage
                  uri={item.avatar_url}
                  style={styles.avatar}
                  lowQuality={true}
                />
              ) : (
                <Avatar.Text
                  size={48}
                  label={item.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()}
                  style={styles.avatar}
                />
              )}
              <View style={styles.userInfo}>
                <Text variant="titleMedium">{item.full_name}</Text>
                <Text variant="bodyLarge" style={styles.points}>
                  {item.points} points
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No entries yet</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Complete requests to earn points and appear on the leaderboard
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    marginRight: 16,
    width: 48,
    textAlign: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  points: {
    opacity: 0.7,
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