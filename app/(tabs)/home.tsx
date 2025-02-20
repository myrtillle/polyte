import { Link } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View, Image } from 'react-native';
import { ActivityIndicator, Button, Card, FAB, Text } from 'react-native-paper';

import { getRequests } from '../../services/requests';
import { Request } from '../../types/request';
import { router } from 'expo-router';
import { RequestFilter as RequestFilterType } from '../../services/requests';
import { RequestFilter } from '../../components/RequestFilter';

export default function HomeScreen() {
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<RequestFilterType>({});

  const loadRequests = async (showRefreshing = false) => {
    try {
      setRefreshing(showRefreshing);
      const data = await getRequests(filter);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, [filter]);

  const renderRequest = ({ item: request }: { item: Request }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">{request.title}</Text>
        
        {request.images.length > 0 && (
          <Image
            source={{ uri: request.images[0].url }}
            style={styles.thumbnail}
          />
        )}

        <Text variant="bodyMedium" style={styles.description}>
          {request.description}
        </Text>
        <Text variant="bodySmall" style={styles.location}>
          📍 {request.location.address}
        </Text>
        <View style={styles.footer}>
          <Text variant="labelLarge" style={styles.points}>
            {request.reward_points} points
          </Text>
          <Button 
            mode="contained"
            onPress={() => {
              if (request.id) {
                router.push({
                  pathname: '/(tabs)/request-details',
                  params: { id: request.id }
                });
              }
            }}
          >
            {request.status === 'open' ? 'Help Out' : 'View Details'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => loadRequests(true)}
        ListHeaderComponent={() => (
          <RequestFilter
            value={filter}
            onChange={setFilter}
          />
        )}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          router.push('/(tabs)/create-request');
        }}
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
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
  },
  location: {
    marginTop: 8,
    opacity: 0.7,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  points: {
    color: '#2196F3',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
}); 