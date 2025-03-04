import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { postsService } from '../services/postsService';
import { authService } from '../services/authService';

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  const itemList = JSON.parse(params.itemList as string);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        // Redirect to login if not authenticated
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/login');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const user = await authService.getCurrentUser();
      if (!user) {
        setError('Please log in to submit a post');
        router.replace('/login');
        return;
      }

      await postsService.createPost({
        user_id: user.id,
        collection_type: params.collectionType as string,
        description: params.description as string,
        kilograms: Number(params.kilograms),
        item_list: itemList,
        collection_mode: params.selectedMode as string,
        location: params.location ? JSON.parse(params.location as string) : undefined,
        photos: params.photos ? JSON.parse(params.photos as string) : undefined,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error submitting post:', error);
      setError('Failed to submit post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => router.back()}
        style={styles.backButton}
      />

      <Text style={styles.title}>Review Your Post</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Collection Type</Text>
        <Text style={styles.value}>{params.collectionType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{params.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Weight</Text>
        <Text style={styles.value}>{params.kilograms} kg</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Items</Text>
        {itemList.map((item: string) => (
          <Text key={item} style={styles.item}>• {item}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Collection Mode</Text>
        <Text style={styles.value}>{params.selectedMode}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      >
        SUBMIT POST
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#00FF57',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  item: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 16,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#00FF57',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
}); 