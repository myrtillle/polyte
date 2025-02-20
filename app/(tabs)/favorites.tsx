import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

import { Favorite, getFavorites } from '../../services/favorites';
import { RequestCard } from '../../components/RequestCard';

const BATCH_SIZE = 20;

export default function FavoritesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const loadFavorites = React.useCallback(async (refresh = false) => {
    try {
      setError(null);
      if (refresh) {
        setRefreshing(true);
      }
      const data = await getFavorites({
        limit: BATCH_SIZE,
        offset: refresh ? 0 : favorites.length,
      });
      setFavorites(prev => refresh ? data : [...prev, ...data]);
      setHasMore(data.length === BATCH_SIZE);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to load favorites'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [favorites.length]);

  const handleRefresh = React.useCallback(() => {
    loadFavorites(true);
  }, [loadFavorites]);

  const handleLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadFavorites();
  }, [loadingMore, hasMore, loadFavorites]);

  React.useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  React.useEffect(() => {
    if (!session?.user) return;

    const subscription = supabase
      .channel(`favorites:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          handleRefresh();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user, handleRefresh]);

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
        data={favorites}
        renderItem={({ item }) => (
          <RequestCard
            request={item.request}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/request-details',
                params: { id: item.request_id }
              });
            }}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text variant="bodyLarge">No favorites yet</Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Bookmark requests to find them easily later
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.loadingMore} />
          ) : null
        }
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
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
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
  loadingMore: {
    paddingVertical: 16,
  },
}); 