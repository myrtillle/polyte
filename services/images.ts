import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export type ImageQuality = 'low' | 'medium' | 'high';

const QUALITY_SETTINGS = {
  low: { quality: 0.3, maxWidth: 800 },
  medium: { quality: 0.6, maxWidth: 1200 },
  high: { quality: 0.8, maxWidth: 1600 },
};

export async function optimizeImage(
  uri: string,
  quality: ImageQuality = 'medium'
): Promise<string> {
  try {
    const settings = QUALITY_SETTINGS[quality];
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: settings.maxWidth } }],
      {
        compress: settings.quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Error optimizing image:', error);
    return uri; // Return original if optimization fails
  }
}

export async function compressImage(
  uri: string,
  targetSizeKB: number = 500
): Promise<string> {
  let quality = 0.8;
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Binary search for optimal quality
  let minQuality = 0.1;
  let maxQuality = 1;
  while (quality > minQuality && await getFileSizeKB(result.uri) > targetSizeKB) {
    maxQuality = quality;
    quality = (minQuality + maxQuality) / 2;
    result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  }

  return result.uri;
}

export async function getFileSizeKB(uri: string): Promise<number> {
  if (Platform.OS === 'web') {
    return 0; // Web doesn't support file size checking
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size / 1024;
} 