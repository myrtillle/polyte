import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { LocationPicker } from '../../components/LocationPicker';
import { createRequest } from '../../services/requests';
import { CreateRequestInput } from '../../types/request';
import { ImagePicker } from '../../components/ImagePicker';
import { uploadImage } from '../../services/supabase';
import { RequestImage } from '../../types/request';
import { CategoryPicker } from '../../components/CategoryPicker';
import { RequestCategory } from '../../types/request';

export default function CreateRequestScreen() {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [rewardPoints, setRewardPoints] = React.useState('');
  const [location, setLocation] = React.useState<CreateRequestInput['location'] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [images, setImages] = React.useState<RequestImage[]>([]);
  const [categories, setCategories] = React.useState<RequestCategory[]>([]);

  const handleSubmit = async () => {
    if (!title || !description || !rewardPoints || !location || categories.length === 0) {
      setError('Please fill in all fields and select at least one category');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const uploadedImages = await Promise.all(
        images.map(async (image) => {
          const extension = image.url.split('.').pop()?.toLowerCase() || 'jpg';
          const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
          const url = await uploadImage(image.url, path);
          return {
            ...image,
            url,
          };
        })
      );

      await createRequest({
        title,
        description,
        reward_points: Number(rewardPoints),
        location,
        images: uploadedImages,
        categories,
      });
      router.back();
    } catch (error) {
      console.error('Error creating request:', error);
      setError('Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Create Request</Text>

      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        disabled={loading}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={4}
        disabled={loading}
      />

      <TextInput
        label="Reward Points"
        value={rewardPoints}
        onChangeText={setRewardPoints}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
        disabled={loading}
      />

      <LocationPicker
        value={location}
        onChange={setLocation}
        disabled={loading}
      />

      <ImagePicker
        value={images}
        onChange={setImages}
        disabled={loading}
      />

      <CategoryPicker
        value={categories}
        onChange={setCategories}
        disabled={loading}
      />

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Create Request
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
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
  },
}); 