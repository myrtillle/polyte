import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { profileService } from '../../services/profileService';
import { postsService } from '../../services/postsService';
import { supabase } from '../../services/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ProfileStackParamList } from '../../types/navigation';
import { RouteProp } from '@react-navigation/native';

type EditProfileScreenRouteProp = RouteProp<ProfileStackParamList, 'EditProfile'>;

const EditProfile = () => {
  const route = useRoute<EditProfileScreenRouteProp>();
  const navigation = useNavigation();
  const { profile } = route.params;

  console.log('📱 EditProfile mounted with profile:', {
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    barangay_id: profile.barangay_id,
    purok_id: profile.purok_id
  });

  const [firstName, setFirstName] = useState(profile.first_name ?? '');
  const [lastName, setLastName] = useState(profile.last_name ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [photo, setPhoto] = useState<string | undefined>(profile.profile_photo_url ?? undefined);

  const [barangays, setBarangays] = useState<{ id: number; name: string }[]>([]);
  const [puroks, setPuroks] = useState<{ id: number; purok_name: string }[]>([]);
  const [barangayId, setBarangayId] = useState<number | null>(profile.barangay_id ?? null);
  const [purokId, setPurokId] = useState<number | null>(profile.purok_id ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDropdowns = async () => {
      console.log('🔄 Fetching location dropdowns...');
      try {
        const [barangayData, purokData] = await Promise.all([
          profileService.fetchBarangays(),
          profileService.fetchPuroks()
        ]);
        
        console.log('✅ Barangays fetched:', barangayData.length);
        console.log('✅ Puroks fetched:', purokData.length);
        
        setBarangays(barangayData);
        setPuroks(purokData);
      } catch (err) {
        console.error('❌ Error fetching dropdowns:', err);
        Alert.alert('Error', 'Failed to load location data');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  const handleImagePick = async () => {
    console.log('📸 Opening image picker...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        console.log('✅ Image selected:', result.assets[0].uri);
        setPhoto(result.assets[0].uri);
      } else {
        console.log('ℹ️ Image selection cancelled');
      }
    } catch (err) {
      console.error("❌ Image Picker Error:", err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    console.log('💾 Starting profile update...');
    try {
      let uploadedUrl = photo;
      
      // Check if photo needs to be uploaded
      if (photo && photo !== profile.profile_photo_url) {
        console.log('📤 Uploading new profile photo...');
        try {
          uploadedUrl = await profileService.uploadImage(photo);
          console.log('✅ Photo uploaded successfully:', uploadedUrl);
        } catch (uploadErr) {
          console.error('❌ Photo upload failed:', uploadErr);
          throw new Error('Failed to upload photo');
        }
      }

      const updateData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        profile_photo_url: uploadedUrl,
        barangay_id: barangayId ?? undefined,
        purok_id: purokId ?? undefined,
      };

      console.log("📤 Updating profile with:", updateData);

      await profileService.updateProfile(profile.id, updateData);
      console.log('✅ Profile updated successfully');

      Alert.alert(
        'Success', 
        'Profile updated!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back and trigger a refresh
              navigation.goBack();
            }
          }
        ]
      );
    } catch (err) {
      console.error('❌ Profile update failed:', err);
      Alert.alert('Error', 'Could not update profile. Please try again.');
    }
  };

  // Log state changes
  useEffect(() => {
    console.log('🔄 Form state updated:', {
      firstName,
      lastName,
      email,
      barangayId,
      purokId,
      hasPhoto: !!photo
    });
  }, [firstName, lastName, email, barangayId, purokId, photo]);

  if (loading) {
    console.log('⏳ Loading state active');
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  console.log('🎨 Rendering EditProfile form');
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={handleImagePick}>
        <Image source={{ uri: photo || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
      </TouchableOpacity>

      <TextInput 
        placeholder="First Name" 
        value={firstName} 
        onChangeText={(text) => {
          console.log('📝 First name changed:', text);
          setFirstName(text);
        }} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Last Name" 
        value={lastName} 
        onChangeText={(text) => {
          console.log('📝 Last name changed:', text);
          setLastName(text);
        }} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={(text) => {
          console.log('📝 Email changed:', text);
          setEmail(text);
        }} 
        style={styles.input} 
      />

      <Text style={styles.label}>Barangay</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={barangayId}
          onValueChange={(value: string | number) => {
            console.log('📍 Barangay selected:', value);
            setBarangayId(value as number);
          }}
          style={styles.picker}
        >
          {barangays.map((b) => (
            <Picker.Item key={b.id} label={b.name} value={b.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Purok</Text>
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={purokId}
          onValueChange={(value: string | number) => {
            console.log('📍 Purok selected:', value);
            setPurokId(value as number);
          }}
          style={styles.picker}
        >
          {puroks.map((p) => (
            <Picker.Item key={p.id} label={p.purok_name} value={p.id} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveText}>SAVE CHANGES</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  dropdownWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden'
  },
  picker: {
    height: 50,
    width: '100%',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#1E592B',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
