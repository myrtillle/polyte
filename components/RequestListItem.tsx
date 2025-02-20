import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, Text, ActivityIndicator } from 'react-native-paper';

import { Request } from '../types/request';
import { CATEGORIES } from '../constants/categories';

type Props = {
  request: Request & {
    created_by_profile: { full_name: string; avatar_url?: string };
    assigned_to_profile?: { full_name: string; avatar_url?: string };
  };
  loading?: boolean;
};

// Add status color helper
const getStatusColor = (status: Request['status']) => {
  switch (status) {
    case 'open':
      return '#4CAF50'; // Green
    case 'in_progress':
      return '#2196F3'; // Blue
    case 'completed':
      return '#9E9E9E'; // Grey
    case 'cancelled':
      return '#F44336'; // Red
    default:
      return '#000000';
  }
};

export function RequestListItem({ request, loading }: Props) {
  return (
    <Card 
      style={[
        styles.card,
        loading && styles.loadingCard
      ]}
      onPress={() => {
        if (!loading) {
          router.push({
            pathname: '/(tabs)/request-details',
            params: { id: request.id }
          });
        }
      }}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text variant="titleMedium">{request.title}</Text>
              <Chip 
                compact 
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(request.status) }
                ]}
                textStyle={{ color: 'white' }}
              >
                {request.status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
            <Text variant="bodyMedium" style={styles.points}>
              {request.reward_points} points
            </Text>
          </View>

          <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
            {request.description}
          </Text>

          <View style={styles.categories}>
            {request.categories?.map((category) => {
              const categoryInfo = CATEGORIES.find(c => c.value === category);
              return (
                <Chip
                  key={category}
                  compact
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: categoryInfo?.backgroundColor,
                    }
                  ]}
                  textStyle={{ color: categoryInfo?.color }}
                  icon={categoryInfo?.icon}
                >
                  {category.toUpperCase()}
                </Chip>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.user}>
              <Avatar.Text
                size={24}
                label={request.created_by_profile.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              />
              <Text variant="bodySmall" style={styles.userName}>
                {request.created_by_profile.full_name}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.location}>
              {request.location.address}
            </Text>
          </View>
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  points: {
    color: '#2196F3',
  },
  description: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    marginLeft: 8,
  },
  location: {
    opacity: 0.7,
  },
  loadingCard: {
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
}); 