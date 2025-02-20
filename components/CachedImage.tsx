import React from 'react';
import { Image, ImageProps, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { ActivityIndicator } from 'react-native-paper';

type CachedImageProps = Omit<ImageProps, 'source'> & {
  uri: string;
  lowQuality?: boolean;
};

const CACHE_FOLDER = `${FileSystem.cacheDirectory}images/`;
const DEFAULT_QUALITY = 0.8;
const LOW_QUALITY = 0.5;

export function CachedImage({ uri, lowQuality, ...props }: CachedImageProps) {
  const [loading, setLoading] = React.useState(true);
  const [cachedUri, setCachedUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadImage() {
      try {
        // Create cache folder if it doesn't exist
        const folder = await FileSystem.getInfoAsync(CACHE_FOLDER);
        if (!folder.exists) {
          await FileSystem.makeDirectoryAsync(CACHE_FOLDER);
        }

        // Generate cache key from URI
        const filename = Buffer.from(uri).toString('base64');
        const quality = lowQuality ? LOW_QUALITY : DEFAULT_QUALITY;
        const ext = uri.split('.').pop() || 'jpg';
        const cacheFile = `${CACHE_FOLDER}${filename}_${quality}.${ext}`;

        // Check if image is already cached
        const cached = await FileSystem.getInfoAsync(cacheFile);
        if (cached.exists) {
          setCachedUri(cacheFile);
          setLoading(false);
          return;
        }

        // Download and cache the image
        await FileSystem.downloadAsync(uri, cacheFile);
        setCachedUri(cacheFile);
      } catch (error) {
        console.error('Error caching image:', error);
        setCachedUri(uri); // Fallback to original URI
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [uri, lowQuality]);

  if (loading) {
    return <ActivityIndicator style={[styles.loader, props.style]} />;
  }

  return (
    <Image
      {...props}
      source={{ uri: cachedUri || uri }}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    alignSelf: 'center',
  },
}); 