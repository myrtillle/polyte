import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scheduleService } from '../../services/scheduleService';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StackNavigationProp } from '@react-navigation/stack';
import { offersService, updateOffer } from '@/services/offersService';
import { notificationService } from '@/services/notificationService';
import { IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScheduleOffer = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ScheduleOffer'>>();
  const { offer, post } = route.params;

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  const handleSchedule = async () => {
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );
  
    const formattedDate = combined.toISOString().split('T')[0];
    const formattedTime = combined.toTimeString().split(' ')[0];
  
    try {
      await scheduleService.createSchedule(offer.id, post.id, post.user_id, formattedDate, formattedTime);
      await updateOffer({ 
        id: offer.id, 
        status: 'accepted' 
      });

      console.log("Offer ID before navigation:", offer?.id);
      console.log("Post ID before navigation:", post?.id);

      Alert.alert('Success', 'Schedule saved successfully!');

      await notificationService.sendNotification(
        offer.user_id, // OF's user_id from the offer
        'Schedule Created',
        `A schedule has been set for your offer. Please review and confirm it.`,
        'schedule_set',
        {
          type: 'offer',
          id: offer.id
        }
      );
      
      navigation.navigate("ViewTransaction", { offerId: offer.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule.');
      console.error('Error saving schedule:', error);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#1A3620' }}>
    <View style={styles.container}>
                <View style={styles.headerContainer}>
                <IconButton
                  icon="arrow-left"
                  size={24}
                  iconColor="white"
                  onPress={() => navigation.goBack()}
                  style={{ position: 'absolute', left: 0 }}
                />
            <Text style={styles.headerTitle}>Schedule</Text>
          </View>
          <View style={styles.mainContent}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.inputText}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setTime(selectedTime);
            }}
          />
        )}
         </View>
        <TouchableOpacity style={styles.button} onPress={handleSchedule}>
            <Text style={styles.buttonText}>Save Schedule</Text>
          </TouchableOpacity>

        </View>
         </View>
     
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#122C0F',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#1A3620',
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  headerTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'regular',
    textTransform: 'uppercase',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  backArrow: {
    color: 'white',
    fontSize: 22,
  },
  
  container: {
    flex: 1,
  
    backgroundColor: '#122C0F',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#BFBFBF',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1E3D28',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  inputText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    
  },
  button: {
    backgroundColor: '#00C853',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 380,
    height:60,


  },
  buttonText: {
    color: 'black',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    justifyContent:'center'
  },
});

export default ScheduleOffer;
