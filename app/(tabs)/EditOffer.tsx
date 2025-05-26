import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Offer, updateOffer, offersService } from '../../services/offersService';
import { IconButton, Button } from 'react-native-paper';

const EditOffer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { offer } = route.params as { offer: Offer }; 

  const [price, setPrice] = useState(offer.price.toString());
  const [offeredWeight, setOfferedWeight] = useState(offer.offered_weight.toString());
  const [message, setMessage] = useState(offer.message);
  // const [selectedItems, setSelectedItems] = useState(offer.offered_items);
  const [images, setImages] = useState(offer.images || []);
  const [availableItems, setAvailableItems] = useState<string[]>([]); 
  const [selectedItems, setSelectedItems] = useState<string[]>(offer.offered_items || []);

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
              return url as string;
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
    }
  };

  const handleUpdateOffer = async () => {
    // Validate required fields
    if (!price || !offeredWeight || selectedItems.length === 0) {
      Alert.alert("Missing Fields", "Please fill in all required fields before updating your offer.");
      return;
    }

    // Validate price is a valid number
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price greater than 0.");
      return;
    }

    // Validate weight is a valid number
    const weightNum = parseFloat(offeredWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight greater than 0.");
      return;
    }

    // Validate weight doesn't exceed requested weight
    if (weightNum > offer.requested_weight) {
      Alert.alert("Invalid Weight", `Offered weight cannot exceed ${offer.requested_weight} kg.`);
      return;
    }

    const updatedOffer = {
      id: offer.id, 
      post_id: offer.post_id, 
      seller_id: offer.seller_id, 
      buyer_id: offer.buyer_id,
      requested_weight: offer.requested_weight, 
      price: priceNum,
      offered_weight: weightNum,
      message: message || '', // Ensure message is never null
      offered_items: selectedItems,
      images: images || [], // Ensure images is never null
    };

    const success = await updateOffer(updatedOffer); 
    if (success) {
      Alert.alert('Success', 'Offer updated successfully!');
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Failed to update offer. Please try again.');
    }
  };

  const handleToggleItem = (item: string) => {
    setSelectedItems(prevItems =>
      prevItems.includes(item)
        ? prevItems.filter(i => i !== item) // Remove if already selected
        : [...prevItems, item] // Add if not selected
    );
  };
  
  console.log("✅ Received offer in EditOffer.tsx:", offer);
  
  useEffect(() => {
    if (offer?.post_item_types) {
      const allTypes = offer.post_item_types.map((item) => item.name);
      console.log("✅ Available Plastic Types from Post:", allTypes); // Debug log
      setAvailableItems(allTypes); // ✅ Store post's available plastic types
    } else {
      console.warn("⚠️ No post_item_types found in offer!");
    }
  
    if (offer?.offered_items) {
      console.log("✅ Pre-Selected Items:", offer.offered_items); // Debug log
      setSelectedItems(offer.offered_items); // ✅ Set offerer's selected items
    } else {
      console.warn("⚠️ No offered_items found in offer!");
    }
  }, [offer]);
  

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />

        {/* Offered Items (readonly) */}
        <Text style={styles.label}>TYPE OF PLASTICS</Text>
        <Text style={styles.subLabel}>Tap an item to select/deselect.</Text>
        <View style={styles.tagContainer}>
        {availableItems.length > 0 ? (
            availableItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleToggleItem(item)}
                style={[
                  styles.tag,
                  styles.tagUnselected,
                  selectedItems.includes(item) && styles.tagSelected
                ]}
              >
                <Text style={styles.tagText}>{item}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.subLabel}>No plastic types available.</Text> // ✅ Display a message if empty
          )}
        </View>
        {/* <View style={styles.tagContainer}>
          {selectedItems.map((item: string, index: number) => (
            <View key={index} style={[styles.tag, styles.tagSelected]}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View> */}

        {/* Weight Input */}
        <Text style={styles.label}>KILOGRAMS</Text>
        <Text style={styles.subLabel}>{offeredWeight} of {offer.requested_weight} kg</Text>
        <TextInput
          style={styles.input}
          value={offeredWeight.toString()}
          onChangeText={text => setOfferedWeight(text)}
          keyboardType="numeric"
        />

        {/* Image Upload */}
        <Text style={styles.label}>Gallery</Text>
        <TouchableOpacity onPress={pickImages} style={styles.imageUploadBox}>
          <Text style={styles.uploadText}>Add images of the items</Text>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {images.map((uri: string, index: number) => (
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

        {/* Save Button */}
        <Button mode="contained" onPress={handleUpdateOffer} style={styles.sendButton}>
          SAVE CHANGES
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
  backButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
});

export default EditOffer;