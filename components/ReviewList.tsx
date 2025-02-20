import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { Rating } from 'react-native-ratings';

import { Review } from '../types/review';

type Props = {
  reviews: (Review & {
    reviewer: { full_name: string; avatar_url?: string };
    reviewee: { full_name: string; avatar_url?: string };
  })[];
};

export function ReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <Text variant="bodyMedium" style={styles.noReviews}>
        No reviews yet
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {reviews.map((review) => (
        <Card key={review.id} style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Avatar.Text
                size={40}
                label={review.reviewer.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              />
              <View style={styles.reviewerInfo}>
                <Text variant="titleMedium">{review.reviewer.full_name}</Text>
                <Rating
                  readonly
                  startingValue={review.rating}
                  imageSize={16}
                  style={styles.rating}
                />
              </View>
            </View>
            {review.comment && (
              <Text variant="bodyMedium" style={styles.comment}>
                {review.comment}
              </Text>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rating: {
    alignItems: 'flex-start',
  },
  comment: {
    marginTop: 8,
  },
  noReviews: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 