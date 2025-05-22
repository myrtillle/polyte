import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList, ProfileStackParamList, MessagesStackParamList, RootStackParamList } from '../../types/navigation';
import { profileService } from '@/services/profileService';
import { Profile } from '../../services/profileService';
import { MaterialIcons } from '@expo/vector-icons';


export default function ProfileScreen() {
  //navigation
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collectionStats, setCollectionStats] = useState({ collected: 0, donated: 0 });
  const [userId, setUserId] = useState<string | null>(null);

  const co2Saved = collectionStats.donated * 1.5;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  };

  const monthsSinceJoined = profile?.created_at
    ? Math.max(
        1,
        (new Date().getFullYear() - new Date(profile.created_at).getFullYear()) * 12 +
        (new Date().getMonth() - new Date(profile.created_at).getMonth())
      )
    : 1;

  const averageMonthly = collectionStats.donated / monthsSinceJoined;

  useEffect(() => {
    const getUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    };
  
    getUserId();
  }, []);
  
  const loadProfile = async () => {
    console.log('🔄 Loading profile data...');
    try {
      setLoading(true);
      const data = await profileService.fetchCurrentUserDetails();
      console.log('✅ Profile data loaded:', {
        name: `${data.first_name} ${data.last_name}`,
        points: data.totalPoints,
        rating: data.averageRating
      });
      setProfile(data);

      if (data?.id) {
        const stats = await profileService.fetchUserCollection(data.id);
        console.log('✅ Collection stats loaded:', stats);
        setCollectionStats(stats);
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log('🎯 Profile screen focused');
      loadProfile();
    }, [])
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Logout Failed:", error.message);
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleClaimReward = () => {
    profileNavigation.navigate('RedeemRewards');
  };

  const handleEditProfile = () => {
    if (profile) {
      profileNavigation.navigate('EditProfile', { profile });
    }
  };

  if (loading) return <ActivityIndicator color="#00D964" size="large" style={{ flex: 1 }} />;

  return (
    <LinearGradient
      colors={['#023F0F', '#05A527']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerWrapper}>
          <TouchableOpacity onPress={handleEditProfile}>
            <Image
              source={{ 
                uri: profile?.profile_photo_url || 'https://i.pravatar.cc/100'
              }}
              style={styles.profileImage}
              onError={(e) => {
                console.error('❌ Image loading error:', e.nativeEvent.error);
                console.log('📸 Attempted to load image from:', profile?.profile_photo_url);
              }}
            />
            <View style={styles.editIconContainer}>
              <MaterialIcons name="edit" size={20} color="#93a267" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.profileName}>{profile.first_name} {profile.last_name}</Text>
            <Text style={styles.profileLocation}> {profile.purok}, {profile.barangay}</Text>
            <Text style={styles.memberSince}>Member Since: {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingSection}>
            <View style={styles.ratingValueContainer}>
              <Text style={styles.rating}>{renderStars(profile.averageRating)}</Text>
              <TouchableOpacity onPress={() => profileNavigation.navigate('Review')}>
                <Text style={styles.viewLink}>View</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ratingLabel}>USER RATING</Text>
          </View>

          <View style={styles.polySection}>
            <Text style={styles.polyCount}>{profile.totalPoints}</Text>
            <Text style={styles.polyLabel}>TOTAL POLYS</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, styles.claimRewardButton]} 
          onPress={handleClaimReward}
        >
          <Text style={styles.claimRewardText}>Redeem Rewards</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => profileNavigation.navigate('MyPosts')}>
          <Text style={styles.actionButtonTextMP}>My Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => profileNavigation.navigate('TransacHist')}>
          <Text style={styles.actionButtonTextTH}>Transaction History</Text>
        </TouchableOpacity>

        <View style={styles.allTimeStatsContainer}>
          <Text style={styles.sectionTitle}>ALL TIME STATS</Text>

          <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
          <Text style={styles.statLabel}>You helped save</Text>
          <Text style={styles.statIcon}>♻️</Text>
        </View>

            
            <Text style={styles.statValue}>{co2Saved.toFixed(2)} KG of CO2!</Text>
          </View>

          <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
          <Text style={styles.statLabel}>Plastic Waste Recycling Status</Text>
          <Text style={styles.statIcon}>🧺</Text>
        </View>
            <View style={styles.statRowSplit}>
              <Text style={styles.statSplit}><Text style={styles.boldText}>DONATED</Text> {collectionStats.donated}</Text>
              <Text style={styles.statSplit}><Text style={styles.boldText}>COLLECTED</Text> {collectionStats.collected}</Text>
            </View>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVERAGE MONTHLY CONTRIBUTION</Text>
            <Text style={styles.statValue}>{averageMonthly.toFixed(1)}</Text>
            <Text style={styles.statSuffix}>SACKS PER MONTH</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    color: '#ccc',
  },

  ratingRow: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: '#00FF66',
  },
  ratingLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  viewLink: {
    fontSize: 13,
    color: '#00FF66',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  polySection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  polyCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF66',
    marginBottom: 4,
  },
  polyLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#1A3620',
    position: 'relative',
    paddingVertical: 20,
    paddingHorizontal: 10,

  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },

  container: { flex: 1 },
  scrollContainer: { padding: 18 },
 
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#00FF66',
  },
  headerTextContainer: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileLocation: {
    color: '#ccc',
    fontSize: 13,
  },
  memberSince: {
    color: '#aaa',
    fontSize: 12,
  },

 
  actionButton: {
    backgroundColor: '#1A3620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 5,
  },
  actionButtonTextMP: {
    color: '#fff',
    textAlign: 'left',
    fontWeight: 'regular',
  },
  actionButtonTextTH: {
    color: '#fff',
    textAlign: 'left',
    fontWeight: 'regular',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  allTimeStatsContainer: {
    backgroundColor: '#1A3620',
    borderRadius: 10,
    padding: 18,
    marginBottom:1,
  },
  statBox: {
    marginBottom:16,
    borderColor:'white'
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statRowSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statSplit: {
    color: '#fff',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
  },
  statSuffix: {
    color: '#9CA3AF',
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  logoutButton: {
    backgroundColor: '#1A3620',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  claimRewardButton: {
    backgroundColor: '#FFD700',
    marginBottom: 16,
  },
  claimRewardText: {
    color: '#023F0F',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#93a267',
  },
});


