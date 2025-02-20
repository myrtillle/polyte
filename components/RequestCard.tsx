import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { Request } from '../services/requests';
import { FavoriteButton } from './FavoriteButton';
import { getDistanceString } from '../utils/distance';
import { getCategoryColor } from '../utils/categories';
import { CachedImage } from './CachedImage';

type RequestCardProps = {
  request: Request;
  onPress?: () => void;
  showDistance?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
};

export function RequestCard({ 
  request, 
  onPress, 
  showDistance,
  userLocation 
}: RequestCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Chip
            mode="flat"
            textStyle={{ color: 'white' }}
            style={{ backgroundColor: getCategoryColor(request.category) }}
          >
            {request.category}
          </Chip>
          <FavoriteButton requestId={request.id} />
        </View>

        <Text variant="titleMedium" style={styles.title}>
          {request.title}
        </Text>

        <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
          {request.description}
        </Text>

        {request.image_url && (
          <CachedImage
            uri={request.image_url}
            style={styles.image}
            lowQuality={true}
          />
        )}

        <View style={styles.footer}>
          {showDistance && userLocation && (
            <View style={styles.distance}>
              <Ionicons name="location" size={16} color="#666" />
              <Text variant="bodySmall" style={styles.distanceText}>
                {getDistanceString(
                  userLocation.latitude,
                  userLocation.longitude,
                  request.latitude,
                  request.longitude
                )}
              </Text>
            </View>
          )}
          <Text variant="bodySmall" style={styles.date}>
            {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginBottom: 4,
  },
  description: {
    opacity: 0.7,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    marginLeft: 4,
    opacity: 0.7,
  },
  date: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
}); 