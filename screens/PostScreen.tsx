import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Chip, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';

const COLLECTION_TYPES = ['Seeking For', 'For Collection'];
const RECYCLABLE_ITEMS = [
  'Plastic Bottles',
  'Paper',
  'Cardboard',
  'Glass',
  'Metal Cans',
  'Electronics',
];

export default function PostScreen() {
  const [collectionType, setCollectionType] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!collectionType || selectedItems.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let imageUrl = null;
      if (image) {
        // Upload image logic here
        // You'll need to implement image upload to Supabase storage
      }

      const { error: postError } = await supabase.from('posts').insert([
        {
          collection_type: collectionType,
          item_list: selectedItems,
          description,
          post_image: imageUrl,
        },
      ]);

      if (postError) throw postError;

      // Reset form
      setCollectionType('');
      setSelectedItems([]);
      setDescription('');
      setImage(null);
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Create New Post</Title>

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Collection Type</Title>
        <View style={styles.chips}>
          {COLLECTION_TYPES.map((type) => (
            <Chip
              key={type}
              selected={collectionType === type}
              onPress={() => setCollectionType(type)}
              style={styles.chip}
            >
              {type}
            </Chip>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Items</Title>
        <View style={styles.chips}>
          {RECYCLABLE_ITEMS.map((item) => (
            <Chip
              key={item}
              selected={selectedItems.includes(item)}
              onPress={() => {
                if (selectedItems.includes(item)) {
                  setSelectedItems(selectedItems.filter((i) => i !== item));
                } else {
                  setSelectedItems([...selectedItems, item]);
                }
              }}
              style={styles.chip}
            >
              {item}
            </Chip>
          ))}
        </View>
      </View>

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={pickImage}
        style={styles.button}
      >
        Add Image
      </Button>

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handlePost}
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
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
}); 