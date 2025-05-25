import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Alert, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Text, TextInput, Button, IconButton } from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { postsService } from '../../services/postsService';
import { supabase } from '../../services/supabase';
import { Post } from '../../services/postsService';
import { ItemType, CollectionMode } from '../../types/postTypes';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

type EditPostRouteProp = RouteProp<RootStackParamList, 'EditPost'>;
type EditPostNavigationProp = StackNavigationProp<RootStackParamList, 'EditPost'>;

interface FormData {
  category_id: number;
  item_type_ids: number[];
  description: string;
  kilograms: string;
  collection_mode_id: number;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  price?: number;
}

const EditPost = () => {
  const route = useRoute<EditPostRouteProp>();
  const navigation = useNavigation<EditPostNavigationProp>();
  const { post } = route.params;

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [collectionModes, setCollectionModes] = useState<CollectionMode[]>([]);
  const [address, setAddress] = useState<string>('');

  
  const parseWKT = (wkt: string) => {
    const match = wkt.match(/POINT\\(([-\\d.]+) ([-\\d.]+)\\)/);
    if (!match) return { latitude: 7.1907, longitude: 125.4553 }; // fallback
    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  };

  const { latitude, longitude } = parseWKT(post.location || '');

  const [formData, setFormData] = useState<FormData>({
    category_id: post.category_id,
    item_type_ids: post.post_item_types?.map((pt: { id: number; name: string }) => pt.id) || [],
    description: post.description,
    kilograms: post.kilograms.toString(),
    collection_mode_id: post.collection_mode_id,
    photos: post.photos || [],
    location: {
      latitude: post.location ? parseFloat(post.location.split(' ')[1].replace(')', '')) : 0,
      longitude: post.location ? parseFloat(post.location.split(' ')[0].replace('POINT(', '')) : 0,
    },
    price: post.price
  });

  useEffect(() => {
    if (post) {
      const { latitude, longitude } = parseWKT(post.location || '');
  
      setFormData({
        category_id: post.category_id,
        item_type_ids: post.post_item_types?.map((pt: { id: number; name: string }) => pt.id) || [],
        description: post.description,
        kilograms: post.kilograms.toString(),
        collection_mode_id: post.collection_mode_id,
        photos: post.photos || [],
        location: { latitude, longitude },
        price: post.price
      });
    }
  }, [post]);
  
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const types = await postsService.getItemTypes();
        setItemTypes(types);
      } catch (error) {
        console.error('Error loading item types', error);
      }
    };
    fetchItemTypes();
  }, []);

  useEffect(() => {
    const fetchModes = async () => {
      try {
        const modes = await postsService.getCollectionModes();
        setCollectionModes(modes);
      } catch (err) {
        console.error('Error loading collection modes', err);
      }
    };
    fetchModes();
  }, []);

  const toggleItemType = (id: number) => {
    setFormData(prev => ({
      ...prev,
      item_type_ids: prev.item_type_ids.includes(id)
        ? prev.item_type_ids.filter(itemId => itemId !== id)
        : [...prev.item_type_ids, id]
    }));
  };
  
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploading(true);
      const uploaded = await Promise.all(
        result.assets.map(async asset => {
          const url = await postsService.uploadImage(asset.uri);
          return url;
        })
      );
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploaded.filter(Boolean)]
      }));
      setUploading(false);
    }
  };

  const handleRemovePhoto = (photo: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p !== photo)
    }));
  };
  
  const formatLocationToWKT = (lat: number, lon: number): string => `POINT(${lon} ${lat})`;

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Error getting address';
    }
  };

  useEffect(() => {
    const getAddress = async () => {
      const address = await reverseGeocode(formData.location.latitude, formData.location.longitude);
      setAddress(address);
    };
    getAddress();
  }, [formData.location]);

  const validateForm = () => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (parseFloat(formData.kilograms) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return false;
    }
    if (!formData.item_type_ids.length) {
      Alert.alert('Error', 'Please select at least one plastic type');
      return false;
    }
    if (!formData.collection_mode_id) {
      Alert.alert('Error', 'Please select a collection mode');
      return false;
    }
    if (!formData.location) {
      Alert.alert('Error', 'Please select a location');
      return false;
    }
    if (formData.category_id === 2 && (!formData.price || formData.price <= 0)) {
      Alert.alert('Error', 'Please enter a valid price for selling posts');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const postData = {
        ...formData,
        kilograms: parseFloat(formData.kilograms.toString()),
        location: formatLocationToWKT(formData.location.latitude, formData.location.longitude)
      };

      await postsService.updatePost(post.id, postData);
      Alert.alert(
        "Success", 
        "Post updated successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error updating post:', err);
      Alert.alert(
        "Error", 
        err instanceof Error ? err.message : "Failed to update post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#1A3620',
      },
      headerTintColor: 'white',
      headerTitleStyle: {
        fontSize: 14,
        fontWeight: 'normal',
        textTransform: 'uppercase',
      },
      headerTitle: 'Edit Post',
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#023F0F' }}>
      <ScrollView style={{ padding: 16 }}>
        <Text style={styles.label}>Category</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Button
                mode={formData.category_id === 1 ? 'contained' : 'outlined'}
                onPress={() => setFormData(prev => ({ ...prev, category_id: 1 }))}
            >
                Selling
            </Button>
            <Button
                mode={formData.category_id === 2 ? 'contained' : 'outlined'}
                onPress={() => setFormData(prev => ({ ...prev, category_id: 2 }))}
            >
                Seeking
            </Button>
        </View>

        <Text style={styles.label}>Type of Plastics</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {itemTypes.map(type => (
                <TouchableOpacity
                key={type.id}
                onPress={() => toggleItemType(type.id)}
                style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: formData.item_type_ids.includes(type.id) ? '#34B951' : '#2C5735',
                }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{type.name}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={formData.description}
          onChangeText={text => setFormData({ ...formData, description: text })}
          mode="outlined"
          style={styles.input}
        />

        <Text style={styles.label}>Kilograms</Text>
        <TextInput
          value={formData.kilograms}
          onChangeText={text => setFormData({ ...formData, kilograms: text })}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        <Text style={styles.label}>Images</Text>
        <View style={styles.imageRow}>
            {formData.photos.map((uri, i) => (
                <View key={i} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(uri)}
                    >
                    <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                </View>
            ))}
            {uploading && <ActivityIndicator />}
        </View>

        <Button mode="contained" onPress={pickImages} style={{ marginVertical: 10 }}>Add Images</Button>

        <Text style={styles.label}>Location</Text>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: formData.location.latitude,
            longitude: formData.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={async (e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setFormData(prev => ({
              ...prev,
              location: { latitude, longitude }
            }));
            const newAddress = await reverseGeocode(latitude, longitude);
            setAddress(newAddress);
          }}
        >
          <Marker
            coordinate={formData.location}
            draggable
            onDragEnd={async (e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setFormData(prev => ({
                ...prev,
                location: { latitude, longitude }
              }));
              const newAddress = await reverseGeocode(latitude, longitude);
              setAddress(newAddress);
            }}
          />
        </MapView>

        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Selected Location:</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>

        <Text style={styles.label}>Mode of Collection</Text>
            <View style={{ gap: 10 }}>
                {collectionModes.map((mode) => {
                    const modeName = mode.name.toLowerCase();
                    let icon;
                    if (modeName.includes('pickup')) {
                    icon = require('../../assets/images/NEW/CAR.png');
                    } else if (modeName.includes('drop')) {
                    icon = require('../../assets/images/NEW/ORANGE.png');
                    } else {
                    icon = require('../../assets/images/NEW/HOUSE.png');
                    }

                    return (
                    <TouchableOpacity
                        key={mode.id}
                        onPress={() => setFormData(prev => ({ ...prev, collection_mode_id: mode.id }))}
                        style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: formData.collection_mode_id === mode.id ? '#00FF57' : '#234A2D',
                        padding: 12,
                        borderRadius: 12,
                        gap: 10,
                        }}
                    >
                        <Image source={icon} style={{ width: 24, height: 24 }} />
                        <Text style={{ color: formData.collection_mode_id === mode.id ? '#000' : '#fff', fontWeight: 'bold' }}>
                        {mode.name.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                    );
                })}
            </View>

        <Button mode="contained" loading={loading} onPress={handleUpdate} style={{ marginTop: 20 }}>
          Update Post
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    color: 'white',
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 10
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 2,
    zIndex: 10,
  },
  removePhotoText: {
    color: 'white',
    fontSize: 12,
  },
  addressContainer: {
    backgroundColor: '#234A2D',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addressLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    marginBottom: 4,
  },
  addressText: {
    color: 'white',
    fontSize: 14,
  },
});

export default EditPost;
