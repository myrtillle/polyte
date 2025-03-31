import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { scheduleService } from '../../services/scheduleService';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import DateTimePicker from '@react-native-community/datetimepicker';

const ScheduleOffer = () => {
  const navigation = useNavigation();
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
      Alert.alert('Success', 'Schedule saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule.');
      console.error('Error saving schedule:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toDateString()}</Text>
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
          <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, padding: 20, backgroundColor: '#122C0F', justifyContent: 'center' 
  },
  title: { 
    fontSize: 22, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 
  },
  inputContainer: { 
    marginBottom: 15 
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  label: { 
    fontSize: 16, color: 'white', marginBottom: 5 
  },
  button: { 
    backgroundColor: '#28a745', padding: 12, borderRadius: 5, alignItems: 'center', marginTop: 20 
  },
  buttonText: { 
    color: 'white', fontSize: 16, fontWeight: 'bold' 
  },
});

export default ScheduleOffer;
