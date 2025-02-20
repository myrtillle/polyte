import * as ExpoImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { RequestImage } from '../types/request';

type Props = {
  value: RequestImage[];
  onChange: (images: RequestImage[]) => void;
  disabled?: boolean;
};

export function ImagePicker({ value, onChange, disabled }: Props) {
  const [loading, setLoading] = React.useState(false);

  const pickImage = async () => {
    try {
      setLoading(true);
      
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages: RequestImage[] = result.assets.map(asset => ({
          url: asset.uri,
          width: asset.width,
          height: asset.height,
        }));
        onChange([...value, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.label}>Images</Text>
      <View style={styles.imageGrid}>
        {value.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: image.url }} style={styles.image} />
            <Button
              mode="contained"
              onPress={() => {
                const newImages = [...value];
                newImages.splice(index, 1);
                onChange(newImages);
              }}
              disabled={disabled}
              style={styles.removeButton}
            >
              Remove
            </Button>
          </View>
        ))}
      </View>
      <Button
        mode="outlined"
        onPress={pickImage}
        loading={loading}
        disabled={disabled || loading}
        icon="image-plus"
      >
        Add Image
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageContainer: {
    width: '48%',
  },
  image: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeButton: {
    marginBottom: 8,
  },
}); 