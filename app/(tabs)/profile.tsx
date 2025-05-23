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
import editIcon from '../../assets/images/edit.png';



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
            <Image
              source={editIcon}
              style={styles.editIconImage}
              resizeMode="contain"
            />
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
          style={[styles.actionButton, styles.claimRewardButton, styles.glowButton]} 
          onPress={handleClaimReward}
        >
<<<<<<< HEAD
          <View style={styles.fullWidthRow}>
            <Text style={styles.claimRewardText}>Redeem Rewards</Text>
=======
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
>>>>>>> 1de81be926400ae9c2643749c5327c4ea525204a
          </View>
        </TouchableOpacity>

<<<<<<< HEAD
        <View style={styles.rowButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.myPostsButton, styles.halfButton]} onPress={() => profileNavigation.navigate('MyPosts')}>
            <Text style={styles.actionButtonTextMP}>My Posts</Text>
          </TouchableOpacity>
          <View style={{ width: 12 }} />
          <TouchableOpacity style={[styles.actionButton, styles.transacHistButton, styles.halfButton]} onPress={() => profileNavigation.navigate('TransacHist')}>
            <Text style={styles.actionButtonTextTH}>Transaction History</Text>
          </TouchableOpacity>
=======
          <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
          <Text style={styles.statLabel}>Plastic Waste Recycling Status</Text>
          <Text style={styles.statIcon}>🧺</Text>
>>>>>>> 1de81be926400ae9c2643749c5327c4ea525204a
        </View>

        <View style={styles.allTimeStatsOuterContainer}>
          <Text style={styles.sectionTitle}>YOUR RECYCLING JOURNEY</Text>
          <View style={styles.allTimeStatsContainer}>
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>CARBON EMISSION SAVED</Text>
                <Text style={styles.statIcon}>♻️</Text>
              </View>
              <Text style={styles.statValue}>
                <Text style={styles.co2Emphasis}>{co2Saved.toFixed(2)}</Text> kg of CO2
              </Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statLabelRow}>
                <Text style={styles.statLabel}>KG OF TRASH</Text>
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
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutButtonText, { textAlign: 'left', width: '100%' }]}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  editIconContainer: {
  position: 'absolute',
  bottom: 0,
  right: 0,
},
editIconImage: {
  width: 28,     // You can resize freely
  height: 28,
},
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
    marginBottom: 1,
  },
  statBox: {
    backgroundColor: '#1A3620',
    borderRadius: 10,
    padding: 18,
    marginBottom: 4,
    borderColor: '#536557',
    borderWidth: 1,
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
  co2Emphasis: {
    color: '#fff',
    fontSize: 20,
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
    backgroundColor: '#794243',
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
    backgroundColor: '#00FF66',
    marginBottom: 6,
  },
  fullWidthRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimRewardText: {
    color: '#023F0F',
    textAlign: 'left',
    fontWeight: 'bold',
    width: '100%',
    fontSize: 16,
    paddingLeft: 2,
  },
  glowButton: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 24,
  },
  myPostsButton: {
    backgroundColor: '#2B5835',
  },
  transacHistButton: {
    backgroundColor: '#2B5835',
  },
  rowButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 2,
  },
  halfButton: {
    flex: 1,
  },
  allTimeStatsOuterContainer: {
    backgroundColor: '#1A3620',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});


