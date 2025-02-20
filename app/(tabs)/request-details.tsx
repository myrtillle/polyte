import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Text, ActivityIndicator } from 'react-native-paper';

import { LoadingScreen } from '../../components/LoadingScreen';
import { getRequestById, updateRequestStatus } from '../../services/requests';
import { Request } from '../../types/request';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewList } from '../../components/ReviewList';
import { getReviewsByRequestId } from '../../services/reviews';
import { ImageGallery } from '../../components/ImageGallery';
import { CATEGORIES } from '../../constants/categories';
import { cache } from '../../services/cache';
import { errorHandler } from '../../utils/errorHandler';
import { CachedImage } from '../../components/CachedImage';
import { Review } from '../types/review';

export default function RequestDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const { session } = useAuth();
  const [request, setRequest] = React.useState<Request | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const loadRequest = React.useCallback(async (refresh = false) => {
    if (!id) return;

    try {
      setError(null);

      // Try cache first if not refreshing
      if (!refresh) {
        const cached = await cache.getCachedData<Request>(`request:${id}`);
        if (cached) {
          setRequest(cached);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const [requestData, reviewsData] = await Promise.all([
        getRequestById(id),
        getReviewsByRequestId(id),
      ]);
      setRequest(requestData);
      setReviews(reviewsData);

      // Cache the result
      await cache.cacheData({
        key: `request:${id}`,
        data: requestData,
        timestamp: Date.now(),
        expiryMinutes: 5,
      });
    } catch (error) {
      setError(errorHandler.handleError(error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleStatusUpdate = async (newStatus: Request['status']) => {
    if (!id) return;
    
    try {
      setUpdating(true);
      await updateRequestStatus(id, newStatus);
      await loadRequest();
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setUpdating(false);
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
        <Button mode="contained" onPress={() => loadRequest(true)}>
          Try Again
        </Button>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.error}>
        <Text variant="bodyLarge">Request not found</Text>
      </View>
    );
  }

  const isOwner = session?.user?.id === request.created_by;
  const isAssigned = session?.user?.id === request.assigned_to;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {request.image_url && (
          <CachedImage
            uri={request.image_url}
            style={styles.image}
            lowQuality={false}
          />
        )}
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="headlineMedium">{request.title}</Text>
              <Chip 
                mode="outlined" 
                style={styles.statusChip}
              >
                {request.status.toUpperCase()}
              </Chip>
            </View>
            
            <ImageGallery images={request.images} />

            <Text variant="bodyLarge" style={styles.description}>
              {request.description}
            </Text>

            <View style={styles.categories}>
              {request.categories?.map((category) => (
                <Chip
                  key={category}
                  style={styles.categoryChip}
                  icon={CATEGORIES.find(c => c.value === category)?.icon}
                >
                  {category.toUpperCase()}
                </Chip>
              ))}
            </View>

            <Text variant="bodyMedium" style={styles.location}>
              📍 {request.location.address}
            </Text>

            <Text variant="headlineSmall" style={styles.points}>
              {request.reward_points} points
            </Text>
          </View>

          {!isOwner && request.status === 'open' && (
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate('in_progress')}
              loading={updating}
              disabled={updating}
              style={styles.actionButton}
            >
              Help Out
            </Button>
          )}

          {isAssigned && request.status === 'in_progress' && (
            <Button
              mode="contained"
              onPress={() => handleStatusUpdate('completed')}
              loading={updating}
              disabled={updating}
              style={styles.actionButton}
            >
              Mark as Completed
            </Button>
          )}

          {isOwner && request.status === 'completed' && (
            <Button
              mode="contained"
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/create-review',
                  params: { requestId: request.id }
                });
              }}
              style={styles.actionButton}
            >
              Leave Review
            </Button>
          )}

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.reviewsTitle}>Reviews</Text>
              <ReviewList reviews={reviews} />
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>
    </ScrollView>
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
  card: {
    margin: 16,
  },
  image: {
    width: '100%',
    height: 200,
  },
  header: {
    gap: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  description: {
    marginTop: 8,
    opacity: 0.7,
  },
  location: {
    opacity: 0.7,
  },
  points: {
    marginTop: 16,
    color: '#2196F3',
  },
  actionButton: {
    marginTop: 24,
  },
  reviewsTitle: {
    marginBottom: 16,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
  },
}); 