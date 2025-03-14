import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, Alert
} from 'react-native';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { createOffer } from '../../services/offersService'; 
import { supabase } from '../../services/supabase'; 

type MakeOfferRouteProp = RouteProp<RootStackParamList, 'MakeOffer'>;

const MakeOffer = () => {
  const route = useRoute<MakeOfferRouteProp>();
  const navigation = useNavigation();
  const post = route.params?.post ?? null;

  const [selectedItems, setSelectedItems] = useState<{ id: number, name: string }[]>(
    post?.post_item_types ? post.post_item_types.map(item => item.item_types) : []
  );
  
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [offeredWeight, setOfferedWeight] = useState(1);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const toggleItemSelection = (itemId: number) => {
    setSelectedItems(prev => {
      if (prev.some(item => item.id === itemId)) {
        return prev.filter(item => item.id !== itemId);
      } else {
        const foundItem = post?.post_item_types?.find(item => item.item_types.id === itemId)?.item_types;
        return foundItem ? [...prev, foundItem] : prev;
      }
    });
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // ✅ Upload images to Supabase instead of storing base64
      const uploadedImages = await Promise.all(
        result.assets.map(async (asset) => await uploadImage(asset.uri))
      );

      // ✅ Store only valid image URLs
      setImages(uploadedImages.filter(url => url !== null));
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const fileName = `${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
  
      // Generate a signed URL for upload
      const { data, error } = await supabase.storage
        .from('offers')
        .upload(fileName, blob, { contentType: "image/jpeg" });
  
      if (error) {
        console.error("Error uploading image:", error.message);
        return null;
      }
  
      // Retrieve the public URL
      const { publicUrl } = supabase.storage.from('offers').getPublicUrl(fileName).data;
      console.log("Image uploaded:", publicUrl);
      return publicUrl; 
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };
  
  
  
  const handleSendOffer = async () => {
    if (!currentUser?.id) {
      console.error("Cannot send offer: No authenticated user!");
      return;
    }
    if (!price || !offeredWeight || selectedItems.length === 0 || images.length === 0) {
      Alert.alert("Missing Fields", "Please fill in all required fields before sending your offer.");
      return;
    }
  
    const offerData = {
      post_id: post.id,             
      user_id: currentUser.id,       
      offered_items: selectedItems.map(item => item.name),
      offered_weight: offeredWeight,
      requested_weight: post.kilograms,
      price,
      message,
      images,         
      status: "pending",
    };
  
    console.log("📌 Offer being sent:", JSON.stringify(offerData, null, 2));
  
    const { data, error } = await supabase.from('offers').insert([offerData]);
  
    if (error) {
      console.error("Error posting offer:", error.message);
    } else {
      console.log("Offer posted successfully:", data);
    }
  };

  // CurrentUser
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else {
        console.log("Authenticated User:", JSON.stringify(data.user, null, 2));
        setCurrentUser(data.user);
      }
    };
    getUser();
  }, []);   

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

        {/* Plastic Types Selection */}
        <Text style={styles.label}>TYPE OF PLASTICS</Text>
        <Text style={styles.subLabel}>Deselect items you are not going to offer.</Text>
        <View style={styles.tagContainer}>
          {(post?.post_item_types ?? []).map(({ item_types }) => (
            <TouchableOpacity 
              key={item_types.id} 
              onPress={() => toggleItemSelection(item_types.id)}
              style={[
                styles.tag, 
                selectedItems.some(item => item.id === item_types.id) ? styles.tagSelected : styles.tagUnselected
              ]}
            >
              <Text style={styles.tagText}>{item_types.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Input */}
        <Text style={styles.label}>KILOGRAMS</Text>
        <Text style={styles.subLabel}>{offeredWeight} of {post.kilograms} kg</Text>
        <TextInput
          style={styles.input}
          value={offeredWeight.toString()}
          onChangeText={text => setOfferedWeight(Number(text))}
          keyboardType="numeric"
        />

        {/* Image Upload */}
        <Text style={styles.label}>Gallery</Text>
        <TouchableOpacity onPress={pickImages} style={styles.imageUploadBox}>
          <Text style={styles.uploadText}>Add images of the items</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.uploadedImage} />
          ))}
        </View>

        {/* Price Input */}
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="00.00"
        />

        {/* Optional Message */}
        <Text style={styles.label}>Say something</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Say something"
        />

        {/* Send Offer Button */}
        <Button mode="contained" onPress={handleSendOffer} style={styles.sendButton}>
          SEND OFFER
        </Button>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#122C0F',
    padding: 15,
  },
  content: { 
    paddingBottom: 20,
  },
  label: {
    color: 'white',
    marginBottom: 3,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  subLabel: {
    color: '#B0B0B0',
    fontSize: 12,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  imageUploadBox: {
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: {
    color: '#666',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  sendButton: {
    marginTop: 20,
    backgroundColor: '#00FF57',
    borderRadius: 20,
    color: '#132718',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, 
    marginBottom: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20, 
  },
  tagSelected: {
    backgroundColor: '#00FF57', 
  },
  tagUnselected: {
    backgroundColor: '#555',
  },
  tagText: {
    color: '#132718', 
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default MakeOffer;
