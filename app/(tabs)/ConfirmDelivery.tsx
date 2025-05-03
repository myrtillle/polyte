import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import { confirmDelivery } from '@/services/transactionService';
import { Button } from 'react-native-paper';
import { ConfirmDeliveryParams } from '@/types/navigation';
import * as FileSystem from 'expo-file-system';
import { transactionService

 } from '@/services/transactionService';
type ImageData = {
    uri: string;
  };

const ConfirmDelivery = () => {
const [image, setImage] = useState<ImageData | null>(null);
  const [uploading, setUploading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: ConfirmDeliveryParams }, 'params'>>();
  const { offerId, offererName, collectorName, photoUrl } = route.params;


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
  
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri });
    }
  };
  

  const handleConfirm = async () => {
    if (!image) {
      Alert.alert('Upload required', 'Please upload an image first.');
      return;
    }
  
    setUploading(true);
  
    try {
      const uploadedUrl = await transactionService.uploadProofImage(image.uri); 
      if (!uploadedUrl) throw new Error("Upload failed");
  
      const success = await transactionService.confirmDelivery(offerId, uploadedUrl);
  
      if (success) {
        Alert.alert('Success', 'Delivery confirmed!');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Something went wrong while confirming delivery.');
      }
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert('Error', 'Image upload or confirmation failed.');
    }
  
    setUploading(false);
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>UPLOAD IMAGE OF COLLECTION</Text>
      <Text style={styles.subtext}>To get your poly rewards please upload proof of collection</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.image} />
      ) : (
        <Text style={styles.placeholderText}>ADD IMAGE OF YOUR WASTE</Text>
      )}
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>TO BE COLLECTED BY:</Text>
        <Text style={styles.value}>{collectorName}</Text>
        <Text style={styles.label}>FROM:</Text>
        <Text style={styles.value}>{offererName}</Text>
        {photoUrl && <Image source={{ uri: photoUrl }} style={styles.thumbnail} />}
      </View>

      <Button
        mode="contained"
        onPress={handleConfirm}
        disabled={uploading}
        style={styles.confirmButton}
      >
        CONFIRM
      </Button>
    </View>
  );
};

export default ConfirmDelivery;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#003d1a' },
  header: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  subtext: { color: '#ccc', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  imagePicker: {
    height: 200, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginVertical: 12,
  },
  placeholderText: { color: '#aaa' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  card: { borderWidth: 1, borderColor: '#00ff88', padding: 10, marginTop: 10 },
  label: { color: '#ccc', fontSize: 12 },
  value: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  thumbnail: { width: 50, height: 50, marginTop: 8 },
  confirmButton: {
    marginTop: 20,
    backgroundColor: '#00ff66',
    paddingVertical: 8,
    borderRadius: 8,
  },
});
