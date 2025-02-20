import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { Request } from '../types/request';

type Props = {
  requests: Request[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

// Only import map components when on mobile
const MapComponent = Platform.select({
  native: () => require('expo-maps').Map,
  default: () => View,
})();

const MarkerComponent = Platform.select({
  native: () => require('expo-maps').Marker,
  default: () => View,
})();

export function RequestMap({ requests, initialRegion }: Props) {
  const router = useRouter();
  const [region, setRegion] = React.useState(initialRegion || {
    latitude: 14.5995,  // Default to Philippines
    longitude: 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // If on web, show placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text>Map view is only available on mobile devices</Text>
      </View>
    );
  }

  // Rest of your existing map code for mobile
  return (
    <View style={styles.container}>
      <MapComponent
        style={styles.map}
        initialRegion={region}
        onRegionChange={setRegion}
      >
        {requests.map((request) => (
          <MarkerComponent
            key={request.id}
            coordinate={{
              latitude: request.location.latitude,
              longitude: request.location.longitude,
            }}
            title={request.title}
            description={`${request.reward_points} points • ${request.status}`}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/request-details',
                params: { id: request.id }
              });
            }}
          />
        ))}
      </MapComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
}); 