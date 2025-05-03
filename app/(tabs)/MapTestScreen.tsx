// screens/MapTestScreen.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, MapPressEvent } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function MapTestScreen() {
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const mapRef = useRef<MapView>(null);

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });

    // Reverse Geocode
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        setAddress(`${geo.name}, ${geo.street}, ${geo.city}`);
      } else {
        setAddress('No address found.');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddress('Error fetching address.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar placeholder */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#ccc" style={{ marginLeft: 8 }} />
        <TextInput
          placeholder="Search place (future)"
          style={styles.searchInput}
          placeholderTextColor="#ccc"
        />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 7.1907, // Davao
          longitude: 125.4553,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      {/* Address Display */}
      {marker && (
        <LinearGradient
          colors={['#023F0F', '#00FF57']}
          style={styles.addressBar}
        >
          <Text style={styles.addressText}>{address}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: '#1A3620',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 8,
  },
  addressBar: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    padding: 12,
    borderRadius: 10,
  },
  addressText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});
