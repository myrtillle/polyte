import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapTestScreen() {
  const tapCounter = useRef(0);

  const [marker, setMarker] = useState({
    latitude: 7.1907, // ✅ Davao City default
    longitude: 125.4553,
  });

  return (
    <View style={{ flex: 1 }}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 7.1907,
          longitude: 125.4553,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => {
          tapCounter.current += 1;
          const { latitude, longitude } = e.nativeEvent.coordinate;
          console.log(`🟢 TAP #${tapCounter.current}: lat=${latitude}, lon=${longitude}`);
          setMarker({ latitude, longitude });
        }}
        showsUserLocation={false} // di nato kailangan muna
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
      >
        <Marker
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title="Selected Location"
        />
      </MapView>
    </View>
  );
}
