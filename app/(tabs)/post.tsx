import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Title, Text, IconButton, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { postsService, CreatePostData } from '../../services/postsService';
import { supabase } from '../../services/supabase';

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
      <Text style={styles.sectionTitle}>Category</Text>
      <SegmentedButtons
        value={formData.category_id?.toString() || ''}
        onValueChange={value => 
          setFormData(prev => ({ ...prev, category_id: parseInt(value) }))
        }
        buttons={categories.map(cat => ({
          value: cat.id.toString(),
          label: cat.name
        }))}
      />

      {/* Item Types Selection */}
      <Text style={styles.sectionTitle}>Item Types</Text>
      <View style={styles.itemTypes}>
        {itemTypes.map(type => (
          <Chip
            key={type.id}
            selected={formData.item_type_ids.includes(type.id)}
            onPress={() => toggleItemType(type.id)}
            style={styles.chip}
          >
            {type.name}
          </Chip>
        ))}
      </View>

      {/* Description */}
      <TextInput
        label="Description"
        value={formData.description}
        onChangeText={text => 
          setFormData(prev => ({ ...prev, description: text }))
        }
        multiline
        style={styles.input}
      />

      {/* Weight */}
      <TextInput
        label="Weight (kg)"
        value={formData.kilograms}
        onChangeText={text => 
          setFormData(prev => ({ ...prev, kilograms: text }))
        }
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.imageUploadSection}>
        <Text style={styles.sectionTitle}>GALLERY</Text>
        <TouchableOpacity style={styles.imageUploadBox}>
          <MaterialCommunityIcons 
            name={'image-plus' as IconName} 
            size={40} 
            color="#666" 
          />
          <Text style={styles.uploadText}>ADD IMAGE OF YOUR WASTE</Text>
        </TouchableOpacity>
      </View>

      {/* Collection Mode */}
      <View style={styles.modeContainer}>
        <View style={styles.collectionModeSection}>
          <Text style={styles.sectionTitle}>MODE OF COLLECTION:</Text>
          {collectionModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeButton,
                formData.collection_mode_id === mode.id && styles.selectedModeButton
              ]}
              onPress={() => setFormData(prev => ({ 
                ...prev, 
                collection_mode_id: mode.id 
              }))}
            >
              <MaterialCommunityIcons 
                name={mode.icon as IconName}
                size={24} 
                color={formData.collection_mode_id === mode.id ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.modeButtonText,
                formData.collection_mode_id === mode.id && styles.selectedModeText
              ]}>
                {mode.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button 
        mode="contained" 
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      >
        Create Post
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  input: {
    marginBottom: 16,
    backgroundColor: '#333',
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
  imageUploadSection: {
    marginVertical: 16,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#666',
    marginTop: 8,
  },
  collectionModeSection: {
    marginVertical: 16,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A3620',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedModeButton: {
    backgroundColor: '#00FF57',
  },
  modeButtonText: {
    color: '#fff',
    marginLeft: 12,
  },
  selectedModeText: {
    color: '#000',
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
  modeContainer: {
    marginVertical: 16,
  },
}); 