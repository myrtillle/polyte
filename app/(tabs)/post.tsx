import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Title, Text, IconButton, SegmentedButtons, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PostStackParamList } from '@/types/navigation'; // adjust if needed
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { postsService, CreatePostData } from '../../services/postsService';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../services/supabase';
import { BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { Animated } from 'react-native';
import Constants from 'expo-constants';
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

  const navigation = useNavigation<StackNavigationProp<PostStackParamList, 'PostMain'>>();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [collectionModes, setCollectionModes] = useState<CollectionMode[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

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

  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>(DAVAO_COORDS);
  const [marker, setMarker] = useState({
    latitude: DAVAO_COORDS.latitude,
    longitude: DAVAO_COORDS.longitude
  });
  const mapRef = useRef<MapView>(null);

  const [address, setAddress] = useState('');

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Add this function to get address from coordinates
  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (response && response[0]) {
        const addressParts = [
          response[0].street,
          response[0].district,
          response[0].city,
          response[0].region,
          response[0].postalCode
        ].filter(Boolean); // Remove null/undefined values

        const formattedAddress = addressParts.join(', ');
        setAddress(formattedAddress);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: formattedAddress
          }
        }));
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress('Address not found');
    }
  };

  // Update getCurrentLocation function
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setMarker({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }));

      // Get address for current location
      await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);

      // Animate to the new region
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location. Using default location instead.');
    }
  };

  // Update the useEffect for map initialization
  useEffect(() => {
    if (Platform.OS === 'android') {
      const timer = setTimeout(() => {
        setMapReady(true);
        getCurrentLocation(); // Get location when map is ready
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setMapReady(true);
      getCurrentLocation(); // Get location when map is ready
    }
  }, []);

  const safeLatitude = isNaN(formData.location.latitude) ? 7.1907 : formData.location.latitude;
  const safeLongitude = isNaN(formData.location.longitude) ? 125.4553 : formData.location.longitude;
  // const [loading, setLoading] = useState(true);

  // Separate state for UI-only data
  const [selectedMode, setSelectedMode] = useState('');


  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Check current number of photos
      if (formData.photos.length >= 5) {
        Alert.alert('Maximum Photos Reached', 'You can only upload up to 5 photos.');
        return;
      }

      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 5 - formData.photos.length, // Limit remaining selections
      });

      if (!result.canceled) {
        const assets = result.assets || [];
        const newPhotos = await Promise.all(
          assets.map(async (asset) => {
            try {
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
          photos: [...prev.photos, ...newPhotos.filter((url) => url !== null)].slice(0, 5),
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
  
  // console.log("navigated to post");
  // Get current user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
  }, []);

  const resetForm = () => {
    setFormData({
      category_id: null,
      item_type_ids: [],
      description: '',
      kilograms: '',
      collection_mode_id: null,
      status: 'active',
      photos: [],
      location: {
        latitude: DAVAO_COORDS.latitude,
        longitude: DAVAO_COORDS.longitude,
        address: '',
      },
      price: '',
    });
    setMarker({
      latitude: DAVAO_COORDS.latitude,
      longitude: DAVAO_COORDS.longitude,
    });
    setStep(1);
  };
  
  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Reset all form data when component unmounts
      setFormData({
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
      setStep(1);
      setMarker({
        latitude: DAVAO_COORDS.latitude,
        longitude: DAVAO_COORDS.longitude,
      });
      setAddress('');
    };
  }, []);

  // Modify the back handler to use router.replace instead of back
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        "Are you sure?",
        "Your changes may not be saved.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Yes", 
            onPress: () => {
              resetForm();
              navigation.navigate('PostMain');
            }
          }
        ]
      );
      return true;
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
      } else {
        console.log('✅ Location permission granted');
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    try {
      setLoading(true);
      setValidationErrors([]);

      const longitude = formData.location?.longitude;
      const latitude = formData.location?.latitude;

      const postData: CreatePostData = {
        ...formData,
        kilograms: parseFloat(formData.kilograms),
        user_id: userId,
        category_id: formData.category_id!,
        collection_mode_id: formData.collection_mode_id!,
        status: 'active',
        photos: Array.isArray(formData.photos) ? formData.photos : [formData.photos],
        location: longitude && latitude ? `POINT(${longitude} ${latitude})` : '',
        price: formData.price ? parseFloat(formData.price) : 0,
      };

      // Validate post data
      const validation = postsService.validatePostData(postData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      await postsService.createPost(postData);
      navigation.goBack();
      resetForm();
      Alert.alert("Success", "Post created successfully! You can view your posts in My Posts section under your profile.");
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

  // Add function to remove a photo
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  if (region) {
    console.log('✅ Rendering MapView with region:', region);
    console.log('🧷 Marker is at:', marker);
  } else {
    console.log('❌ Region is null or undefined at render');
  }
  
  const validateStep1 = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.category_id) {
      errors.push('Please select a category');
    }

    if (!formData.item_type_ids || formData.item_type_ids.length < 2) {
      errors.push('Please select at least 2 types of plastics');
    }

    if (!formData.kilograms || parseFloat(formData.kilograms) <= 0) {
      errors.push('Please enter a valid weight in kilograms');
    }

    if (!formData.collection_mode_id) {
      errors.push('Please select a collection mode');
    }

    if (!formData.photos || formData.photos.length === 0) {
      errors.push('Please add at least one photo');
    }

    // Price validation for selling category
    if (formData.category_id === 2 && (!formData.price || parseFloat(formData.price) <= 0)) {
      errors.push('Please enter a valid price');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleNext = () => {
    const validation = validateStep1();
    if (!validation.isValid) {
      Alert.alert('Required Fields', validation.errors.join('\n'));
      return;
    }
    setStep(2);
  };

  // Modify the header back button handler
  const handleBackPress = () => {
    Alert.alert(
      "Are you sure?",
      "Your changes may not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: () => {
            resetForm();
            navigation.reset({
              index: 0,
              routes: [{ name: 'PostMain' }],
            });
          }
        }
      ]
    );
  };

  return (
    
    <View style={{ flex: 1, backgroundColor: '#023F0F' }}>
      {/* Sticky Header */}
      <View style={styles.headerContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor="white"
          onPress={handleBackPress}          
          style={styles.backIcon}
        />
        <Text style={styles.headerTitle}>Create Post</Text>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 16 }}>
        <View style={[styles.stepDot, step === 1 && styles.activeDot]} />
        <View style={[styles.stepDot, step === 2 && styles.activeDot]} />
      </View>
      
      {step === 1 && (
        <ScrollView 
          style={{ padding: 16, backgroundColor: '#023F0F', flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          scrollEnabled={true}  
          nestedScrollEnabled={true}
        >
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

          <Text style={styles.sectionTitle}>WASTE INFORMATION</Text>
          {/* Item Types Section */}
          <View style={styles.itemTypesContainer}>
            <View style={styles.itemTypesHeader}>
              <Text style={styles.itemTypesTitle}>TYPE OF PLASTICS</Text>
              <Text style={styles.itemTypesInfo}>SELECT AT LEAST 1</Text>
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
            <Text style={styles.photoLimitText}>{formData.photos.length}/5 photos</Text>
            
            <View style={styles.imageUploadWrapper}>
              {formData.photos.length < 5 && (
                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImages}>
                  <MaterialCommunityIcons 
                    name={'image-plus' as IconName} 
                    size={50} 
                    color="#aaa" 
                  />
                  <Text style={styles.uploadText}>ADD IMAGE OF YOUR WASTE</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.imageContainer}>
              {formData.photos?.map((uri: string, index: number) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.uploadedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removePhoto(index)}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {uploading && <ActivityIndicator size="large" color="#00FF57" />}
            </View>
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
            onPress={handleNext} 
            style={[
              styles.button,
              !validateStep1().isValid && styles.buttonDisabled
            ]}
            disabled={!validateStep1().isValid}
          >
            Next
          </Button>
        </ScrollView>
      )}

      {step === 2 && (
        <View style={{ flex: 1, backgroundColor: '#023F0F' }}>
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, marginVertical: 12 }}>
            Tap to drop a pin on the map
          </Text>

          <View style={styles.mapContainer}>
            {mapReady ? (
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={setRegion}
                onPress={async (e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setMarker({ latitude, longitude });
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      latitude,
                      longitude
                    }
                  }));
                  // Get address for tapped location
                  await getAddressFromCoordinates(latitude, longitude);
                }}
              >
                <Marker
                  coordinate={marker}
                  draggable
                  onDragEnd={async (e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setMarker({ latitude, longitude });
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        latitude,
                        longitude
                      }
                    }));
                    // Get address for dragged location
                    await getAddressFromCoordinates(latitude, longitude);
                  }}
                />
              </MapView>
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <ActivityIndicator size="large" color="#00FF57" />
              </View>
            )}
          </View>

          {/* Address Display Box */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Selected Location:</Text>
            <Text style={styles.addressText}>{address || 'Loading address...'}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
            <Button mode="outlined" onPress={() => setStep(1)}>
              Back
            </Button>
            <Button mode="contained" onPress={handleSubmit} loading={loading}>
              Submit Post
            </Button>
          </View>
        </View>
      )}

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
  centerPin: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  marginLeft: -20, // half of pin width
  marginTop: -40,  // full pin height
  zIndex: 10,
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
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: '#00FF57',
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
    paddingTop: 16,
    paddingBottom: 30,
    marginTop: 16,
    zIndex: 100,
    height: 300,
  },
  
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  mapPlaceholder: {
    backgroundColor: '#1A3620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContainer: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  addressLabel: {
    color: '#00FF57',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  photoLimitText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    margin: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#2C5735',
    opacity: 0.7,
  },
}); 