import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

export default function CreatePostScreen() {
  const [collectionType, setCollectionType] = useState('');
  const [itemList, setItemList] = useState('');
  const [description, setDescription] = useState('');
  const [postImage, setPostImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreatePost = async () => {
    if (!collectionType || !itemList || !description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user?.id,
          collection_type: collectionType,
          item_list: itemList.split(',').map(item => item.trim()),
          description,
          post_image: postImage,
        }]);

      if (error) throw error;

      router.push('/');
    } catch (err) {
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Create Post</Title>

      <TextInput
        label="Collection Type"
        value={collectionType}
        onChangeText={setCollectionType}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Item List (comma separated)"
        value={itemList}
        onChangeText={setItemList}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Post Image URL"
        value={postImage}
        onChangeText={setPostImage}
        mode="outlined"
        style={styles.input}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleCreatePost}
        loading={loading}
        style={styles.button}
      >
        Create Post
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.button}
      >
        Back
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
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});
