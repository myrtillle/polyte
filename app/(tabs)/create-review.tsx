import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Rating } from 'react-native-ratings';

import { createReview } from '../../services/reviews';
import { getRequestById } from '../../services/requests';
import { LoadingScreen } from '../../components/LoadingScreen';

export default function CreateReviewScreen() {
  const params = useLocalSearchParams<{ requestId: string }>();
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [revieweeId, setRevieweeId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadRequest = async () => {
      try {
        const request = await getRequestById(params.requestId);
        setRevieweeId(request.assigned_to || null);
      } catch (error) {
        console.error('Error loading request:', error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (params.requestId) {
      loadRequest();
    } else {
      router.back();
    }
  }, [params.requestId]);

  const handleSubmit = async () => {
    if (!revieweeId) {
      setError('Cannot find helper to review');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await createReview({
        request_id: params.requestId,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      router.back();
    } catch (error) {
      console.error('Error creating review:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Leave a Review</Text>

      <View style={styles.ratingContainer}>
        <Text variant="bodyLarge" style={styles.label}>Rating</Text>
        <Rating
          startingValue={rating}
          onFinishRating={setRating}
          style={styles.rating}
          imageSize={40}
        />
      </View>

      <TextInput
        label="Comment (Optional)"
        value={comment}
        onChangeText={setComment}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={4}
        disabled={submitting}
      />

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={submitting}
        disabled={submitting}
      >
        Submit Review
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
  },
  ratingContainer: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  rating: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 