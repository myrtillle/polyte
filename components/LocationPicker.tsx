import * as Location from 'expo-location';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

type LocationType = {
  latitude: number;
  longitude: number;
  address: string;
};

type Props = {
  value: LocationType | null;
  onChange: (location: LocationType | null) => void;
  disabled?: boolean;
};

export function LocationPicker({ value, onChange, disabled }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const getCurrentLocation = async () => {
    try {
      setError('');
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // For now, we'll just use coordinates as the address
      const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      onChange({
        latitude,
        longitude,
        address,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Error getting location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.label}>Location</Text>

      {value ? (
        <View style={styles.locationContainer}>
          <TextInput
            value={value.address}
            mode="outlined"
            disabled
            style={styles.input}
          />
          <Button
            mode="outlined"
            onPress={() => onChange(null)}
            disabled={disabled}
          >
            Change
          </Button>
        </View>
      ) : (
        <Button
          mode="outlined"
          onPress={getCurrentLocation}
          loading={loading}
          disabled={disabled || loading}
          icon="map-marker"
        >
          Get Current Location
        </Button>
      )}

      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
  },
}); 