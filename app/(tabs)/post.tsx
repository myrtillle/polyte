import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Title, Text, IconButton, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { postsService, CreatePostData } from '../../services/postsService';
import { supabase } from '../../services/supabase';

import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';

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
}

export default function PostScreen() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [collectionModes, setCollectionModes] = useState<CollectionMode[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Separate state for UI-only data
  const [selectedMode, setSelectedMode] = useState('');

  // Form data that matches our database schema
  const [formData, setFormData] = useState<FormData>({
    category_id: null,
    item_type_ids: [],
    description: '',
    kilograms: '',
    collection_mode_id: null,
    status: 'active'
  });

  // Get current user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getSession();
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

  const handleSubmit = async () => {
    if (!userId || !formData.category_id || !formData.collection_mode_id) {
      console.error('Missing required fields');
      return;
    }

    try {
      setLoading(true);
      const postData: CreatePostData = {
        ...formData,
        kilograms: parseFloat(formData.kilograms),
        user_id: userId,
        category_id: formData.category_id,
        collection_mode_id: formData.collection_mode_id,
        status: 'active'
      };
      await postsService.createPost(postData);
      router.back();
    } catch (error) {
      console.error('Error creating post:', error);
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

  return (
    <ScrollView style={styles.container}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => router.back()}
        style={styles.backButton}
      />

      {/* Category Selection */}
      <View style={styles.categoryContainer}>
  <Text style={styles.sectionTitle}>CATEGORY</Text>

  {/* Selling Category Button */}
  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, category_id: categories[0]?.id }))}>
    <LinearGradient
      colors={formData.category_id === categories[0]?.id ? ['#023F0F', '#00FF57'] : ['#103D20', '#103D20']}
      style={styles.categoryButton}
    >
      <Text style={styles.categoryText}>SELLING</Text>
      <Image source={require('../../assets/images/selling.png')} style={styles.categoryImage} />
    </LinearGradient>
  </TouchableOpacity>

  {/* Seeking Category Button */}
  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, category_id: categories[1]?.id }))}>
    <LinearGradient
      colors={formData.category_id === categories[1]?.id ? ['#023F0F', '#00FF57'] : ['#103D20', '#103D20']}
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

    />
  </View>
</View>

      {/* Weight */}
      <View style={styles.kilogramsContainer}>
  <View style={styles.kilogramsHeader}>
    <Image source={require('../../assets/images/trashbag.png')} style={styles.kilogramsIcon} />
    <Text style={styles.kilogramsTitle}>TOTAL KILOGRAMS</Text>
  </View>

  <View style={styles.kilogramsInputContainer}>
    <TextInput
      value={formData.kilograms}
      onChangeText={text => setFormData(prev => ({ ...prev, kilograms: text }))}
      keyboardType="numeric"
      underlineColor="transparent"
      style={styles.kilogramsInput}
    />
  </View>
  
</View>
<View style={styles.galleryContainer}>
  <Text style={styles.sectionTitle}>GALLERY</Text>
  
  <View style={styles.imageUploadWrapper}>
    <TouchableOpacity style={styles.imageUploadBox}>
      <MaterialCommunityIcons 
        name={'image-plus' as IconName} 
        size={50} 
        color="#aaa" 
      />
      <Text style={styles.uploadText}>ADD IMAGE OF YOUR WASTE</Text>
    </TouchableOpacity>
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
        mode="contained" 
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      >
        CREATE POST
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
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
    marginBottom: 20,
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
    padding: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom:10,
  },


  kilogramsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A3620', // Background box
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 5,
    gap:10
  },
  
  kilogramsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  kilogramsIcon: {
    width: 20, // Adjust icon size
    height: 20,
    resizeMode: 'contain',
    marginRight: 10,
  },
  
  kilogramsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  kilogramsInputContainer: {
    backgroundColor: '#234A2D', // Dark Green input box
    
    borderRadius: 5,
    paddingHorizontal: 2,
    paddingVertical: 10,
    minWidth: 80, // Adjust based on design
    alignItems: 'center',
  },
  
  kilogramsInput: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'transparent',
    height:20,
    
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
    backgroundColor: '#00FF00',
    paddingVertical: 8,
  },
 
}); 