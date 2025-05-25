import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, ScrollView, Alert
} from 'react-native';
import { Button,  IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { HomeStackParamList, RootStackParamList } from '../../types/navigation';
import { createOffer } from '../../services/offersService'; 
import { supabase } from '../../services/supabase'; 
import { notificationService } from '@/services/notificationService';
import { Offer, offersService } from '../../services/offersService';

type MakeOfferRouteProp = RouteProp<HomeStackParamList, 'MakeOffer'>;

const MakeOffer = () => {
  const route = useRoute<MakeOfferRouteProp>();
  const navigation = useNavigation();
  const post = route.params?.post ?? null;

  const [selectedItems, setSelectedItems] = useState<{ id: number, name: string }[]>(
    post?.post_item_types ? post.post_item_types.map(item => ({
      id: item.id,
      name: item.name
    })) : []
  );
  
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [offeredWeight, setOfferedWeight] = useState(1);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [offerSent, setOfferSent] = useState(false);


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
        const foundItem = post?.post_item_types?.find(item => item.id === itemId);
        return foundItem ? [...prev, { id: foundItem.id, name: foundItem.name }] : prev;
      }
    });
  };
  // setImages(uploadedImages.filter(url => url !== null));
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }
      
      // Check if already at max limit
      if (images.length >= 5) {
        Alert.alert(
          "Maximum Photos Reached",
          "You can only upload up to 5 photos. Please remove some photos before adding more.",
          [{ text: "OK" }]
        );
        return;
      }

      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 5 - images.length, // Limit selection to remaining slots
      });
  
      if (!result.canceled) {
        const assets = result.assets || [];
        const allowedSlots = 5 - images.length;
        const assetsToUpload = assets.slice(0, allowedSlots);
        
        const uploadedImages = await Promise.all(
          assetsToUpload.map(async (asset) => {
            try {
              const url = await offersService.uploadImage(asset.uri);
              if (!url) throw new Error("Image upload returned null");
              return url;
            } catch (uploadError) {
              console.error("Image upload failed:", uploadError);
              return null;
            }
          })
        );
  
        setImages(prevImages => [...prevImages, ...uploadedImages.filter(url => url !== null)]);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error picking images:", error.message);
        Alert.alert("Error", error.message);
      } else {
        console.error("Unknown error while picking images:", error);
        Alert.alert("Error", "An unexpected error occurred while picking images.");
      }
    } finally {
      setUploading(false);
    }
  };
  // const uploadImage = async (uri: string) => {
  //   try {
  //     const fileName = `${Date.now()}.jpg`;
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  
  //     // Generate a signed URL for upload
  //     const { data, error } = await supabase.storage
  //       .from('offers')
  //       .upload(fileName, blob, { contentType: "image/jpeg" });
  
  //     if (error) {
  //       console.error("Error uploading image:", error.message);
  //       return null;
  //     }
  
  //     // Retrieve the public URL
  //     const { publicUrl } = supabase.storage.from('offers').getPublicUrl(fileName).data;
  //     console.log("Image uploaded:", publicUrl);
  //     return publicUrl; 
  //   } catch (error) {
  //     console.error("Image upload failed:", error);
  //     return null;
  //   }
  // };
  const removeImage = async (uriToRemove: string) => {
    const filename = uriToRemove.split('/').pop();
  
    if (!filename) {
      console.warn('❌ Could not extract filename from URI:', uriToRemove);
      return;
    }
  
    const { error } = await supabase.storage.from('offers').remove([filename]);
  
    if (error) {
      console.error('❌ Failed to delete from Supabase:', error.message);
      Alert.alert("Delete failed", "Could not remove image from storage.");
    } else {
      console.log('🗑️ Deleted from Supabase:', filename);
      setImages(prev => prev.filter(uri => uri !== uriToRemove));
    }
  };
  

  const handleSendOffer = async () => {
    if (!currentUser?.id) {
      console.error("Cannot send offer: No authenticated user!");
      return;
    }
    
    // Validate required fields
    if (!price || !offeredWeight || selectedItems.length === 0) {
      Alert.alert("Missing Fields", "Please fill in all required fields before sending your offer.");
      return;
    }

    // Validate price is a valid number
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0.");
      return;
    }

    // Validate weight is a valid number
    if (isNaN(offeredWeight) || offeredWeight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight greater than 0.");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert("Missing Plastic Item Type", "Please select plastic item(s) you would like to offer.");
      return;
    }
    
    if (offeredWeight > post.kilograms) {
      Alert.alert("Offer too high", `Offered weight cannot exceed ${post.kilograms} kg.`);
      return;
    }

    const offerData = {
      post_id: post.id,
      user_id: currentUser.id,
      offered_items: selectedItems.map(item => item.name),
      offered_weight: offeredWeight,
      requested_weight: post.kilograms,
      price: priceNum, // Use the validated price number
      message: message || '', // Ensure message is never null
      images: images || [], // Ensure images is never null
      status: "pending",
    };
  
    console.log("📌 Offer being sent:", JSON.stringify(offerData, null, 2));
  
    const { data, error } = await supabase
      .from('offers')
      .insert([offerData])
      .select()
    
    if (error) {
      console.error("Error posting offer:", error.message);
    } else {
      const offerId = data?.[0]?.id;

      if (!offerId) {
        console.warn('No offerId returned — notification skipped.');
        return;
      }

      console.log("Offer posted successfully:", data);
     

      if (!offerId) {
        console.warn('No offerId returned — notification skipped.');
        return;
      }
      
      setOfferSent(true);
  
      await notificationService.sendNotification(
        post.user_id,
        'New Offer Received',
        `Someone submitted an offer on your post: "${post.description}"`,
        'new_offer',
        {
          type: 'offer',
          id: post.id
        }
      );
  
      setTimeout(() => {
        navigation.goBack();
      }, 2500);
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

  useEffect(() => {
    console.log("📌 Received new post in MakeOffer:", JSON.stringify(post, null, 2));
  
    if (post?.post_item_types) {
      console.log("✅ post_item_types exists, resetting selection.");
      console.log("🧪 selectedItems:", selectedItems);
      setSelectedItems(post.post_item_types.map(item => ({
        id: item.id,
        name: item.name
      })));
    } else {
      console.error("❌ post_item_types is missing in MakeOffer!");
      setSelectedItems([]); // Prevent lingering state
    }
  }, [post]); // Runs whenever post changes  

  useEffect(() => {
    const checkExistingOffer = async () => {
      if (!currentUser?.id || !post?.id) return;

      try {
        const { data: existingOffers, error } = await supabase
          .from('offers')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error("Error checking existing offers:", error);
          return;
        }

        if (existingOffers && existingOffers.length > 0) {
          Alert.alert(
            "Existing Offer",
            "You have already made an offer for this post. You can edit your existing offer instead.",
            [
              { 
                text: "Go Back", 
                onPress: () => navigation.goBack()
              }
            ]
          );
        }
      } catch (error) {
        console.error("Error in checkExistingOffer:", error);
      }
    };

    checkExistingOffer();
  }, [currentUser?.id, post?.id]);

  if (offerSent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B4B1C' }}>
        <Image source={require('../../assets/images/bell.png')} style={{ width: 90, height: 90, marginBottom: 20 }} />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ACTION WAS SENT,</Text>
        <Text style={{ color: '#ccc', marginTop: 4, fontSize: 12 }}>CHECK NOTIFICATIONS FOR UPDATES</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
 

    <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Plastic Types Selection */}
        <Text style={styles.label}>TYPE OF PLASTICS</Text>
        <Text style={styles.subLabel}>Deselect items you are not going to offer.</Text>
        <View style={styles.tagContainer}>
          {(post?.post_item_types ?? []).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => toggleItemSelection(item.id)}
              style={[
                styles.tag, 
                selectedItems.some(selectedItem => selectedItem.id === item.id) ? styles.tagSelected : styles.tagUnselected
              ]}
            >
              <Text style={styles.tagText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight Input */}
        <View style={styles.kilogramsContainer}>
  <View style={styles.kilogramsHeader}>
    <Image source={require('../../assets/images/trashbag.png')} style={styles.kilogramsIcon} />
    <Text style={styles.kilogramsTitle}>TOTAL KILOGRAMS</Text>
  </View>

  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <TextInput
      value={offeredWeight.toString()}
      onChangeText={text => {
        const value = Number(text);
        if (value > post.kilograms) {
          Alert.alert("Invalid Input", `You cannot offer more than ${post.kilograms} kg.`);
          return;
        }
        setOfferedWeight(value);
      }}
      keyboardType="numeric"
      style={[styles.kilogramsInput, { minWidth: 80 }]}
    />
    <Text style={{ color: '#ccc', fontSize: 12 }}>of {post.kilograms} kg</Text>
  </View>
</View>


        {/* Image Upload */}
        <Text style={styles.label}>Gallery</Text>
        <TouchableOpacity onPress={pickImages} style={styles.imageUploadBox}>
          <Text style={styles.uploadText}>Add images of the items</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <View key={index} style={{ position: 'relative', marginRight: 10 }}>
              <Image source={{ uri }} style={styles.uploadedImage} />
              <TouchableOpacity 
                onPress={() => removeImage(uri)} 
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: 'red',
                  borderRadius: 10,
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
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
          placeholderTextColor="#888" // ← your desired color here
        />

        {/* Optional Message */}
        <Text style={styles.label}>Say something</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Say something"
          placeholderTextColor="#888" // ← your desired color here
        />


        {/* Send Offer Button */}
        <Button mode="contained" onPress={handleSendOffer} style={styles.sendButton} labelStyle={{ fontSize:16, color: '#132718', fontWeight: 'bold' }}>
          SEND OFFER
        </Button>

        </ScrollView>
      </View>
  
  
  );
};

const styles = StyleSheet.create({
  scrollContent: {
  paddingHorizontal: 20,
  paddingBottom: 30,
  paddingTop: 10,
},

label: {
  color: 'white',
  marginTop: 10, // 🆕 gives breathing room between sections
  marginBottom: 2,
  fontWeight: '700',
  fontSize: 16,
  textTransform: 'uppercase',
},

subLabel: {
  color: '#B0B0B0',
  fontSize: 12,
  marginBottom: 10,
  marginTop: -6, // aligns tightly under label
},

imageUploadBox: {
  borderWidth: 2,
  borderColor: '#666',
  borderStyle: 'dashed',
  borderRadius: 8,
  height: 100,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 12, // consistent with other fields
},

imageContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 20,
},

input: {
  backgroundColor: '#1A3A20',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderWidth: 1.5,
  borderColor: '#949B84',
  color: '#FFFFFF',
  fontSize: 14,
  marginBottom: 15,
},

sendButton: {
  marginTop: 30,
  backgroundColor: '#00FF57',
  paddingVertical: 12,
  borderRadius: 20,
  marginBottom: 40,
},

  kilogramsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A3620',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 10,
  },
  
  kilogramsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  kilogramsIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  
  kilogramsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  kilogramsInput: {
    backgroundColor: '#1A3A20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#949B84',
    color: '#fff',
    fontSize: 14,
    minWidth: 80,
    textAlign: 'center',
  },
  

  inputWrapper: {
    backgroundColor: '#1A3A20',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#949B84',
    marginBottom: 10,
  },
  
  

  container: { 
    flex: 1, 
    backgroundColor: '#122C0F',
  },
  innerContent: {
    paddingHorizontal: 16, // 👈 consistent with ViewPost styling
    paddingBottom: 20,
  },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#1A3620',
    position: 'relative',
  },
  
  content: { 
    paddingHorizontal: 16, // ✅ now works only for inner content
    paddingBottom: 20,
  },
  
  
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  

  
  uploadText: {
    color: '#666',
  },
 
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
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
    borderRadius:5, 
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
  backButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
});

export default MakeOffer;
