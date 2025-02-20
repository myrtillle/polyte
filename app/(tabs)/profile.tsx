import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { getProfile, getUserStats, getUserReviews } from '../../services/profiles';
import { ReviewList } from '../../components/ReviewList';
import { cache } from '../../services/cache';
import { errorHandler } from '../../utils/errorHandler';
import { CachedImage } from '../../components/CachedImage';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<{
    total_points: number;
    completed_requests: number;
    average_rating: number;
  } | null>(null);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [error, setError] = React.useState<Error | null>(null);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const userMetadata = session?.user?.user_metadata;

  const loadProfile = React.useCallback(async (refresh = false) => {
    if (!session?.user) return;

    try {
      setError(null);

      // Try cache first if not refreshing
      if (!refresh) {
        const cached = await cache.getCachedData(`profile:${session.user.id}`);
        if (cached) {
          setStats(cached.stats);
          setReviews(cached.reviews);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const data = await getProfile(session.user.id);
      setStats(data.stats);
      setReviews(data.reviews);

      // Cache the result
      await cache.cacheData({
        key: `profile:${session.user.id}`,
        data,
        timestamp: Date.now(),
        expiryMinutes: 30, // Cache profile for longer
      });
    } catch (error) {
      setError(errorHandler.handleError(error, {
        retry: () => loadProfile(refresh),
      }));
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <LoadingScreen />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error}>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error.message}
        </Text>
        <Button mode="contained" onPress={() => loadProfile(true)}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            {session?.user?.avatar_url ? (
              <CachedImage
                uri={session.user.avatar_url}
                style={styles.avatar}
                lowQuality={true}
              />
            ) : (
              <Avatar.Text 
                size={64} 
                label={userMetadata?.full_name?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase() || '??'} 
              />
            )}
            <View style={styles.userInfo}>
              <Text variant="titleLarge">{userMetadata?.full_name}</Text>
              <Text variant="bodyMedium">{session?.user?.email}</Text>
              <Text variant="bodyMedium" style={styles.userType}>
                {userMetadata?.user_type?.charAt(0).toUpperCase() + 
                 userMetadata?.user_type?.slice(1)} Account
              </Text>
            </View>
          </View>
          {stats && (
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text variant="headlineMedium">{stats.total_points}</Text>
                <Text variant="bodyMedium">Points Earned</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium">{stats.completed_requests}</Text>
                <Text variant="bodyMedium">Completed</Text>
              </View>
              <View style={styles.stat}>
                <Text variant="headlineMedium">
                  {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
                </Text>
                <Text variant="bodyMedium">Avg Rating</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.reviewsTitle}>
            Reviews
          </Text>
          <ReviewList reviews={reviews} />
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={handleSignOut}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Sign Out
      </Button>

      <Button
        mode="contained"
        onPress={() => router.push('/settings')}
        style={styles.editButton}
      >
        Edit Profile
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userType: {
    marginTop: 4,
    opacity: 0.7,
  },
  button: {
    marginTop: 'auto',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
  },
  reviewsTitle: {
    marginBottom: 16,
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
  avatar: {
    marginBottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editButton: {
    marginTop: 16,
  },
}); 