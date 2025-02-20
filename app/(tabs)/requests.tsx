import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { ActivityIndicator, SegmentedButtons, FAB, Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { getRequests } from '../../services/requests';
import { Request } from '../../types/request';
import { RequestListItem } from '../../components/RequestListItem';
import { RequestFilter } from '../../components/RequestFilter';
import { RequestFilter as RequestFilterType } from '../../services/requests';
import { RequestMap } from '../../components/RequestMap';
import { cache } from '../../services/cache';
import { errorHandler } from '../../utils/errorHandler';
import { TestFilter } from '../../components/TestFilter';

type ViewMode = 'map' | 'list';

export default function RequestsScreen() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');
  const [requests, setRequests] = React.useState<Request[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [filter, setFilter] = React.useState<RequestFilterType>({});
  const [error, setError] = React.useState<string | null>(null);
  const [testFilter, setTestFilter] = React.useState('');
  const router = useRouter();

  const handleFilterChange = React.useCallback((newFilter: RequestFilterType) => {
    console.log('Filter changed:', newFilter);
    setFilter(newFilter);
  }, []);

  function handleTestFilter(value: string) {
    console.log('Test filter value:', value);
    setTestFilter(value);
  }

  const loadRequests = React.useCallback(async (refresh = false) => {
    try {
      setError(null);
      if (refresh) {
        setRefreshing(true);
      }

      // Try cache first if not refreshing
      if (!refresh) {
        const cached = await cache.getCachedData<Request[]>('requests');
        if (cached) {
          setRequests(cached);
          setLoading(false);
        }
      }

      // Fetch fresh data
      const response = await getRequests({
        ...filter,
        userLocation: userLocation || undefined,
      });

      if (!response || !response.data) {
        throw new Error('Failed to load requests');
      }

      setRequests(response.data);

      // Cache the results
      if (refresh) {
        await cache.cacheData({
          key: 'requests',
          data: response.data,
          timestamp: Date.now(),
          expiryMinutes: 5,
        });
      }
    } catch (error) {
      setError(errorHandler.handleError(error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, userLocation]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  React.useEffect(() => {
    getCurrentLocation();
  }, []);

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
        <Button mode="contained" onPress={() => loadRequests(true)}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' },
          ]}
          style={styles.viewToggle}
        />
        <TestFilter 
          onFilterChange={handleTestFilter} 
        />
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <RequestMap
            requests={requests}
            userLocation={userLocation}
            onRequestPress={(id) => router.push(`/request/${id}`)}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={({ item }) => (
            <RequestListItem
              request={item}
              onPress={() => router.push(`/request/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => loadRequests(true)}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text variant="headlineSmall">No requests found</Text>
              <Text variant="bodyMedium" style={styles.emptyDescription}>
                Try adjusting your filters or create a new request
              </Text>
            </View>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/create-request')}
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
  header: {
    padding: 16,
    paddingBottom: 0,
  },
  viewToggle: {
    marginBottom: 16,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 