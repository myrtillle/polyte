import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList, MessagesStackParamList, ProfileStackParamList, RootStackParamList } from '../../types/navigation';
import { Button, IconButton } from 'react-native-paper';
import { offersService, Schedule } from '../../services/offersService';
import { StackNavigationProp } from '@react-navigation/stack';
import { scheduleService } from '@/services/scheduleService';
import { supabase } from '@/services/supabase';

const CollectionSchedule = () => {
  //navigation
  const homeNavigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const profileNavigation = useNavigation<StackNavigationProp<ProfileStackParamList>>();
  const messagesNavigation = useNavigation<StackNavigationProp<MessagesStackParamList>>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const route = useRoute<RouteProp<RootStackParamList, 'CollectionSchedule'>>();
  const offerId = route.params?.offerID;
  console.log("Received offer ID:", offerId);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await offersService.getOfferSchedule(offerId);
        setSchedule(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      }
    };
    fetchSchedule();
  }, [offerId]);

  const handleGoToChat = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error("Failed to get user:", error?.message || "User not found");
      return;
    }
    const userId = user.id;
    if (schedule) {
      messagesNavigation.navigate('ChatScreen', {
        chatId: offerId,
        userId,
        schedule,
      });
    }
  };

  const handleCancelSchedule = async () => {
    try {
      await offersService.cancelSchedule(offerId);
      navigation.goBack();
    } catch (error) {
      console.error("Error cancelling schedule:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00FF66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
     
      {/* HEADER */}
      <View style={styles.headerBar}>
        <IconButton
                  icon="arrow-left"
                  size={24}
                  iconColor="white"
                  onPress={() => navigation.goBack()}
                  style={{ position: 'absolute', left: 0 }}
                />
              <Text style={styles.headerTitle}>SCHEDULE</Text>
            </View>

      {/* CONTENT */}
      <View style={styles.contentWrapper}>

  {/* STATUS CARD */}
  <View style={styles.card}>
    <Text style={styles.label}>STATUS</Text>
    <Text style={styles.value}>{schedule?.status?.toUpperCase()}</Text>
  </View>

  {/* SCHEDULED CARD */}
  <View style={styles.card}>
    <Text style={styles.label}>SCHEDULED IN</Text>
    <Text style={styles.valueLarge}>{schedule?.scheduled_time} - {schedule?.scheduled_date}</Text>

    <Text style={styles.labelSmall}>SETTLED AT</Text>
<View style={styles.rowCenter}>
  <Image 
    source={require('../../assets/images/greenmark.png')} 
    style={styles.locationIcon} 
    resizeMode="contain" 
  />
  <Text style={styles.value}>
    {schedule?.purok}, {schedule?.barangay}
  </Text>
</View>



   
    
  </View>

  {/* COLLECTED BY CARD */}
  <View style={styles.cardRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.labelSmall}>TO BE COLLECTED BY :</Text>
      <Text style={styles.value}>{schedule?.collectorName}</Text>

      <Text style={[styles.labelSmall, { marginTop: 12 }]}>FROM:</Text>
      <Text style={styles.value}>{schedule?.offererName}</Text>
    </View>

    {schedule?.photoUrl && (
      <Image source={{ uri: schedule.photoUrl }} style={styles.imagePreview} />
    )}
  </View>

  {/* ACTION BUTTONS */}
  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.button}>
      <Image source={require('../../assets/images/paperplane.png')} style={styles.buttonIcon} />
      <Text style={styles.buttonText}>SEND MESSAGE</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.buttoncancel}>
      <Text style={styles.buttonTextcancel}>CANCEL SCHEDULE</Text>
    </TouchableOpacity>
  </View>

</View>

    </View>
  );
};

const styles = StyleSheet.create({

    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        paddingBottom: 3,
      },
      
 
      locationIcon: {
        width: 12,  // ← change this freely anytime (size control)
        height: 12, // ← change this freely anytime
        marginRight: 8,
      },
      

    contentWrapper: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 30,
      },
      
      card: {
        backgroundColor: '#2E5C3C',
        borderRadius: 10,
        padding: 20,
        marginBottom: 8,
      },
      
      cardRow: {
        backgroundColor: '#2E5C3C',
        borderRadius: 10,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
      },
      
      label: {
        color: '#D0D0D0',
        fontSize: 12,
        marginBottom: 6,
      },
      
      labelSmall: {
        color: '#D0D0D0',
        fontSize: 12,
        marginTop: 10,
        marginBottom: 4,
      },
      
      value: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
      
      valueLarge: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
      },

      
      imagePreview: {
        width: 90,
        height: 90,
        borderRadius: 10,
        marginLeft: 12,
      },
      
      buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        
        gap: 8,
      },
      
      button: {
        flex: 1,
        backgroundColor: '#2E5C3C',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
      },

      buttoncancel: {
        flex: 1,
        backgroundColor: '#D84343',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        
      },
      
      buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        marginRight:9,
      },
      buttonTextcancel: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        justifyContent: 'center',
      },
      
      buttonIcon: {
        width: 18,
        height: 18,
        tintColor: '#00FF66',
        marginRight: 11,
      },
      




  container: { flex: 1, backgroundColor: '#023F0F' },

  
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#1A3620',
    position: 'relative',
  },
  
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },


  status: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF66',
    marginBottom: 8,
  },
  time: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 6,
  },
  location: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  collectedBy: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  from: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
  },
 
 
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#023F0F',
  },
});

export default CollectionSchedule;
