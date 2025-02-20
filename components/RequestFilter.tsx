import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text, SegmentedButtons, Menu, Button } from 'react-native-paper';

import { RequestFilter as RequestFilterType } from '../services/requests';
import { RequestStatus } from '../types/request';
import { CATEGORIES } from '../constants/categories';

type Props = {
  onFilterChange: (filter: RequestFilterType) => void;
  userLocation: { latitude: number; longitude: number } | null;
};

const STATUS_OPTIONS: RequestStatus[] = ['open', 'in_progress', 'completed', 'cancelled'];
const DISTANCE_OPTIONS = [
  { value: '0', label: 'All' },
  { value: '1', label: '1km' },
  { value: '5', label: '5km' },
  { value: '10', label: '10km' },
];

export function RequestFilter({ onFilterChange, userLocation }: Props) {
  // Start with just one filter to test
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const filter: RequestFilterType = {
      search: search || undefined,
      userLocation: userLocation || undefined,
    };
    onFilterChange(filter);
  }, [search, userLocation, onFilterChange]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Searchbar
          placeholder="Search requests..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchbar: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
  },
  distance: {
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    marginBottom: 0,
  },
}); 