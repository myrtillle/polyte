import React from 'react';
import { Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { RequestImage } from '../types/request';

type Props = {
  images: RequestImage[];
};

export function ImageGallery({ images }: Props) {
  const { width } = useWindowDimensions();
  const imageWidth = width - 32; // Full width minus padding

  if (images.length === 0) return null;

  return (
    <ScrollView 
      horizontal 
      pagingEnabled
      showsHorizontalScrollIndicator={true}
      style={styles.container}
    >
      {images.map((image, index) => (
        <View key={index} style={[styles.imageContainer, { width: imageWidth }]}>
          <Image
            source={{ uri: image.url }}
            style={[
              styles.image,
              {
                width: imageWidth,
                height: (imageWidth * image.height) / image.width,
              },
            ]}
            resizeMode="contain"
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 8,
  },
}); 