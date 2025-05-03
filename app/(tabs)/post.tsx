import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Platform } from 'react-native';
import { TextInput, Button, Title, Text, IconButton, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { postsService, CreatePostData } from '../../services/postsService';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE, Region, MapViewProps  } from 'react-native-maps';
// import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase';
import { BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { rgbaColor } from 'react-native-reanimated/lib/typescript/Colors';

type IconName = 'account-multiple' | 'map-marker' | 'home' | 'image-plus';

const itemOptions = [
  'Plastic Cups',
  'Water Bottles',
  'Softdrink Bottles',
  'Tupperware',
  'Cellophane',
];

const COLLECTION_MODES = [
  { id: 'meetup', title: 'MEET UP', icon: 'account-multiple' },
  { id: 'pickup', title: 'PICK UP FROM DROP OFF', icon: 'map-marker' },
  { id: 'location', title: 'MEET IN MY LOCATION', icon: 'home' },
];

const { width, height } = Dimensions.get('window');

// Define interfaces for the data types
interface Category {
  id: number;
  name: string;
}

interface ItemType {
  id: number;
  name: string;
}

interface CollectionMode {
  id: number;
  name: string;
  icon: IconName;
}

interface FormData {
  category_id: number | null;
  item_type_ids: number[];
  description: string;
  kilograms: string;
  collection_mode_id: number | null;
  status: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  price?: string;
}

export default function PostScreen() {
  const DAVAO_COORDS = {
    latitude: 7.1907,
    longitude: 125.4553,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
    
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [collectionModes, setCollectionModes] = useState<CollectionMode[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  //location
  const [region, setRegion] = useState<Region>(DAVAO_COORDS);
  const [marker, setMarker] = useState({ latitude: DAVAO_COORDS.latitude, longitude: DAVAO_COORDS.longitude });
  const [address, setAddress] = useState('');
  const mapRef = useRef<MapView>(null);
  // const [loading, setLoading] = useState(true);

  // Separate state for UI-only data
  const [selectedMode, setSelectedMode] = useState('');

  // Form data matching db schema
  const [formData, setFormData] = useState<FormData>({
    category_id: null,
    item_type_ids: [],
    description: '',
    kilograms: '',
    collection_mode_id: null,
    status: 'active',
    photos: [],
    location: {
      latitude: 7.1907,
      longitude: 125.4553,
      address: '',
    },
    price: '',
  });

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
  
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });
  
      if (!result.canceled) {
        const assets = result.assets || [];
  
        const uploadedImages = await Promise.all(
          assets.map(async (asset) => {
            try {
              console.log("Picked asset (Android):", asset);
  
              // Use the uploadImage function from postsService
              const url = await postsService.uploadImage(asset.uri);
              if (!url) {
                throw new Error("Image upload returned null or undefined");
              }
              return url;
            } catch (uploadError: unknown) {
              if (uploadError instanceof Error) {
                console.error("Error uploading image:", uploadError.message);
                Alert.alert("Image upload failed", uploadError.message);
              } else {
                console.error("Unknown upload error:", uploadError);
                Alert.alert("Image upload failed", "An unexpected error occurred");
              }
              return null;
            }
          })
        );
  
        setFormData((prev) => ({
          ...prev,
          photos: uploadedImages.filter((url) => url !== null),
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error picking images:", error.message);
        Alert.alert("Error", error.message);
      } else {
        console.error("Unknown error while picking images:", error);
        Alert.alert("Error", "An unexpected error occurred while picking images.");
      }
    } finally {
      setUploading(false);
    }
  };
  
  // Get current user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        "Are you sure?",
        "Your changes may not be saved.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes", onPress: () => router.back() }
        ]
      );
      return true; // prevent default back
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove(); // cleanup
  }, []);
  
  // Load all necessary data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, itemTypesData, modesData] = await Promise.all([
          postsService.getCategories(),
          postsService.getItemTypes(),
          postsService.getCollectionModes()
        ]);
        setCategories(categoriesData);
        setItemTypes(itemTypesData);
        setCollectionModes(modesData);
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    loadData();
  }, []);


  const formatLocationToWKT = (lat: number, lon: number): string => {
    return `POINT(${lon} ${lat})`;
  };

  const handleSubmit = async () => {
    if (!userId || !formData.category_id || !formData.collection_mode_id) {
      console.error('Missing required fields');
      return;
    }
  
    try {
      setLoading(true);
      
      const { latitude, longitude } = formData.location;
      // Format location for database submission
      const formattedLocation = formatLocationToWKT(latitude, longitude);
  
      const postData: CreatePostData = {
        ...formData,
        kilograms: parseFloat(formData.kilograms),
        user_id: userId,
        category_id: formData.category_id,
        collection_mode_id: formData.collection_mode_id,
        status: 'active',
        photos: Array.isArray(formData.photos) ? formData.photos : [formData.photos],
        location: formattedLocation, 
        price: formData.price ? parseFloat(formData.price) : 0,
      };
  
      console.log("Submitting post data:", JSON.stringify(postData, null, 2));
  
      await postsService.createPost(postData);
      router.back();
  
      // Reset form after submission
      setFormData({
        category_id: null,
        item_type_ids: [],
        description: '',
        kilograms: '',
        collection_mode_id: null,
        status: 'active',
        photos: [],
        location: {
          latitude: 0,
          longitude: 0,
          address: '',
        },
      });
      setAddress('');
      setMarker({ latitude: 0, longitude: 0 });
      Alert.alert("Success", "Post created successfully!");
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };
  
  // toggle item type selection
  const toggleItemType = (typeId: number) => {
    setFormData(prev => ({
      ...prev,
      item_type_ids: prev.item_type_ids.includes(typeId)
        ? prev.item_type_ids.filter(id => id !== typeId)
        : [...prev.item_type_ids, typeId]
    }));
  };

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
        headers: {
          'User-Agent': 'Polyte/1.0',
          'Accept-Language': 'en',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch address');
      const data = await response.json();
      setAddress(data.display_name);
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  };
  
  const onDragEnd = (e: { nativeEvent: { coordinate: { latitude: number, longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    console.log("Dragged to:", latitude, longitude);
    
    // Update both location and form data states
    setMarker({ latitude, longitude });
    // setFormData((prev) => ({
    //   ...prev,
    //   location: { latitude, longitude, address: '' },
    // }));
    
    // Fetch the address after updating the location
    fetchAddress(latitude, longitude);
  };
  

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
  
        const { coords } = await Location.getCurrentPositionAsync({});
        setMarker({ latitude: coords.latitude, longitude: coords.longitude });
  
        // animate to user's location
        mapRef.current?.animateToRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
  
        fetchAddress(coords.latitude, coords.longitude);  
      } catch (err) {
        console.warn('Location fallback to Davao');
      }
    })();
  }, []);
  

  

  return (
    <View style={{ flex: 1, backgroundColor: '#023F0F' }}>

      {/* Sticky Header */}
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="white"
          onPress={() =>
            Alert.alert(
              "Are you sure?",
              "Your changes may not be saved.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: () => router.back() }
              ]
            )
          }          
          style={styles.backIcon}
        />
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={{ padding: 16, backgroundColor: '#023F0F' }}>

        <Text style={styles.headerTitle}>Create Post</Text>
        
        {/* Category Selection */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>CATEGORY</Text>

          {/* SELLING Button */}
          <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, category_id: categories[1]?.id }))}>
            <LinearGradient
              colors={
                formData.category_id === categories[1]?.id
                  ? ['#023F0F', '#00FF57']  // selected = gradient
                  : ['#2C5735', '#2C5735']  // not selected = solid color
              }
              style={styles.categoryButton}
            >
              <Text style={styles.categoryText}>SELLING</Text>
              <Image source={require('../../assets/images/selling.png')} style={styles.categoryImage} />
            </LinearGradient>
          </TouchableOpacity>

          {/* SEEKING Button */}
          <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, category_id: categories[0]?.id }))}>
            <LinearGradient
              colors={
                formData.category_id === categories[0]?.id
                  ? ['#023F0F', '#00FF57']
                  : ['#2C5735', '#2C5735']
              }
              style={styles.categoryButton}
            >
              <Text style={styles.categoryText}>SEEKING</Text>
              <Image source={require('../../assets/images/seeking.png')} style={styles.categoryImage} />
            </LinearGradient>
          </TouchableOpacity>

        </View>

        <Text style={styles.sectionTitle}>WASTER INFORMATION</Text>
        {/* Item Types Section */}
        <View style={styles.itemTypesContainer}>
          <View style={styles.itemTypesHeader}>
            <Text style={styles.itemTypesTitle}>TYPE OF PLASTICS</Text>
            <Text style={styles.itemTypesInfo}>SELECT AT LEAST 2</Text>
            <MaterialCommunityIcons name="information-outline" size={18} color="limegreen" />
          </View>

          <View style={styles.itemTypesGrid}>
            {itemTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[styles.itemTypeButton, formData.item_type_ids.includes(type.id) && styles.selectedItemType]}
                onPress={() => toggleItemType(type.id)}
              >
                <Text style={styles.itemTypeText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>DESCRIPTION</Text>
          <View style={styles.descriptionBox}>
            <TextInput
              label=""
              value={formData.description}
              onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              style={styles.input}
              underlineColor="transparent"
              textColor="#FFFFFF"
              activeUnderlineColor="transparent"
            />
          </View>
        </View>

        {/* Weight */}
        <View style={styles.kilogramsContainer}>
        <View style={styles.kilogramsLabel}>
          <Image source={require('../../assets/images/trashbag.png')} style={styles.kilogramsIcon} />
          <Text style={styles.kilogramsTitle}>TOTAL KILOGRAMS</Text>
        </View>

        <View style={styles.kilogramsInputWrapper}>
          <TextInput
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            value={formData.kilograms}
            onChangeText={text => setFormData(prev => ({ ...prev, kilograms: text }))}
            keyboardType="numeric"
          
          style={[styles.kilogramsInput, { color: '#FFFFFF' }]}
            textColor="#FFFFFF"
          />
        </View>

        {formData.category_id === categories[1]?.id && ( // SELLING category
          <View style={styles.kilogramsContainer}>
            <View style={styles.kilogramsLabel}>
              {/* <Image source={} style={styles.kilogramsIcon} /> */}
              <Text style={styles.kilogramsTitle}>PRICE</Text>
            </View>

            <View style={styles.kilogramsInputWrapper}>
              <TextInput
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                value={formData.price || ''}
                onChangeText={text => setFormData(prev => ({ ...prev, price: text }))}
                keyboardType="numeric"
                style={[styles.kilogramsInput, { color: '#FFFFFF' }]}
                textColor="#FFFFFF"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.galleryContainer}>
        <Text style={styles.sectionTitle}>GALLERY</Text>
        
        <View style={styles.imageUploadWrapper}>
          <TouchableOpacity style={styles.imageUploadBox} onPress={pickImages}>
            <MaterialCommunityIcons 
              name={'image-plus' as IconName} 
              size={50} 
              color="#aaa" 
            />
            <Text style={styles.uploadText}>ADD IMAGE OF YOUR WASTE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {formData.photos?.map((uri: string, index: number) => (
            <Image key={index} source={{ uri }} style={styles.uploadedImage} />
          ))}
          {uploading && <ActivityIndicator size="large" color="#00FF57" />}
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#00FF57" />
        ) : (
          <>
            <MapView
              ref={ mapRef }
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={DAVAO_COORDS}
              onPress={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                console.log('Tapped:', latitude, longitude);
                setMarker({ latitude, longitude });
            
                // ✅ Update formData.location too
                setFormData(prev => ({
                  ...prev,
                  location: {
                    latitude,
                    longitude,
                    address: '', // you can fill it later after fetchAddress if you want
                  }
                }));
            
                fetchAddress(latitude, longitude);
              }}
            >
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  console.log('Dragged to:', latitude, longitude);
                  setMarker({ latitude, longitude });
              
                  // ✅ Update formData.location too
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      latitude,
                      longitude,
                      address: '', // fill address later if needed
                    }
                  }));
              
                  fetchAddress(latitude, longitude);
                }}
              />
            </MapView>

            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>Address: {address || 'Tap the map to set location.'}</Text>
            </View>

            <Button mode="contained" onPress={() => Alert.alert('Location Selected!')} style={styles.button} 
            labelStyle={{ fontSize:14, color: '#132718', fontWeight: 'regular' }}>
              
              CONFIRM LOCATION
            </Button>
          </>
        )}
      </View>

      {/* Collection Mode */}
      <View>
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>MODE OF COLLECTION:</Text>

          {collectionModes.map((mode) => {
          const modeName = mode.name.toLowerCase();

          let iconSource;
          if (modeName.includes('pickup')) {
            iconSource = require('../../assets/images/NEW/CAR.png');
          } else if (modeName.includes('drop')) {
            iconSource = require('../../assets/images/NEW/ORANGE.png');
          } else if (modeName.includes('meet')) {
            iconSource = require('../../assets/images/NEW/HOUSE.png');
          } else {
            iconSource = require('../../assets/images/NEW/HOUSE.png'); // fallback
          }

          return (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.collectionCard,
                formData.collection_mode_id === mode.id && styles.collectionCardSelected,
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, collection_mode_id: mode.id }))
              }
            >
              <Image source={iconSource} style={styles.collectionIcon} />
              <Text
                style={[
                  styles.collectionText,
                  formData.collection_mode_id === mode.id && styles.collectionTextSelected,
                ]}
              >
                {mode.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}

        </View>
      </View>
      
      <Button 
        mode="contained" 
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
        labelStyle={{ fontSize:16, color: '#132718', fontWeight: 'bold' }}
      >
        CREATE POST
      </Button>
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1A3620',
    position: 'absolute',  // ✅ sticky
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 5, // ✅ Android shadow
  },
  
  kilogramsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A3620',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 5,
  },
  
  kilogramsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  kilogramsIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  
  kilogramsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  kilogramsInputWrapper: {
    backgroundColor: '#1A3A20',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#949B84',
    minWidth: 100,
    height: 40, // ✅ Set fixed height
  },
  
  kilogramsInput: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
    height: 30,         // ✅ Constrain text height
  },
  
  
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  

  
  backIcon: {
    position: 'absolute',
    left: 0,
  },
  

  
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#234A2D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  
  collectionCardSelected: {
    backgroundColor: '#00FF57',
  },
  
  collectionIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 16,
  },
  
  collectionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  
  collectionTextSelected: {
    color: '#000000',
  },
  

  categoryContainer: {
    marginTop: 40,
  },
  categoryButton: {
    flexDirection: 'row', // Align text & image in a row
    justifyContent: 'space-between', // Push image to the right
    alignItems: 'center', // Align vertically
    paddingHorizontal: 20,
    paddingVertical: 0,
    borderRadius: 12,
    marginBottom: 12,
    height:100,
  },
  categoryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  categoryImage: {
    width: 150, // Adjust size based on your image
    height: 100,
    resizeMode: 'contain',
  },
  
  galleryContainer: {
    backgroundColor: '#1A3620', // Dark green background
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginBottom: 5,
  },
  
  imageUploadWrapper: {
    justifyContent: 'center',
  },
  
  imageUploadBox: {
    width: '100%',
    height: 180,
    borderWidth: 2, // **Ultra-thin border**
    borderColor: 'rgba(255, 255, 255, 0.2)', // **Even lighter color for subtle effect**
    borderStyle: 'dashed',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // **Softer background**
  },
  
  uploadText: {
    color: '#bbb', // **Slightly brighter for better visibility**
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },

  itemTypesContainer: {
    backgroundColor: '#1A3620', // Dark green background
    borderRadius: 12,
    marginBottom: 5,
    paddingHorizontal: 12,
    paddingVertical:25,
  },
  
  itemTypesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  
  itemTypesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,

  },
  
  itemTypesInfo: {
    color: '#aaa',
    fontSize: 8,
    textTransform: 'uppercase',
    marginRight: 8,
  },
  
  itemTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal:10,
  },
  
  itemTypeButton: {
    backgroundColor: '#2C5735',
    paddingVertical: 5,
    paddingHorizontal:12,
    borderRadius: 5,
    width: '30%', // 3 columns layout
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    margin: 0.01, // 5px total gap (2.5px on each side)
  },
  
  selectedItemType: {
    backgroundColor: '#34B951', // Selected color
    
  },
  
  itemTypeText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center', // Centers text for multiline support
    flexWrap: 'wrap', // Ensures text wraps inside button
  },
  

  
  container: {
    flex: 1,
    backgroundColor: '#023F0F',
  },
  backButton: {
    marginLeft: -8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  itemTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    margin: 4,
  },
  


  descriptionContainer: {
    backgroundColor: '#1A3620', // Dark green background
    borderRadius: 12,
    marginBottom: 5,
    paddingHorizontal: 20,
    paddingVertical:25,
  },
  
  descriptionBox: {
    backgroundColor: '#1A3A20', // Slightly lighter green inside
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#949B84', // Light grayish-green border
  },
  
  input: {
    backgroundColor: 'transparent', // Transparent to blend in
    borderWidth: 0, // Remove default border
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 2,
    marginBottom:10,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#1A3620',
    margin: 5,
  },
  selectedTag: {
    backgroundColor: '#00FF57',
  },
  tagText: {
    color: 'white',
  },


  locationPlaceholder: {
    marginBottom: 24,
  },
  placeholderBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {
    marginLeft: 8,
    color: '#666',
  },
  button: {
    marginVertical: 24,
    backgroundColor: '#00FF57',
    paddingVertical: 8,
    width: '100%',
     
  },
  mapContainer: {
    backgroundColor: '#1A3620',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    marginTop: 16,
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: 250, // 🟢 Reduced from screen height
    borderRadius: 10,
  },
  addressContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  
}); 