import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reviewService } from '@/services/reviewService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation'; // adjust as needed
import { supabase } from '@/services/supabase';
import { transactionService } from '@/services/transactionService';

export default function Ratings() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  //   const navigation = useNavigation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { offerId } = useRoute().params as { offerId: string };

  useEffect(() => {
    const fetchTransaction = async () => {
      const data = await transactionService.fetchTransactionDetails(offerId); // ✅ Load related post
      setTransaction(data);
    };

    fetchTransaction();
  }, [offerId]);
  
  const submitReview = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const reviewer_id = userData?.user?.id;
    const reviewed_user_id = transaction?.collector_id || transaction?.offerer_id;

    if (!reviewer_id || !reviewed_user_id) {
      Alert.alert("Error", "Missing user info. Please try again.");
      return;
    }

    const success = await reviewService.submitReview({
      offer_id: offerId,
      reviewer_id,
      reviewed_user_id,
      rating,
      comment
    });

    if (success) {
      Alert.alert(
        "Success",
        "Thank you for your review!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate('TransacHist')
          }
        ]
      );
    } else {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Rate your experience</Text>
      <View style={styles.stars}>
        {[1,2,3,4,5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setRating(i)}>
            <Text style={[styles.star, i <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        placeholder="Leave a comment..."
        multiline
        value={comment}
        onChangeText={setComment}
        style={styles.input}
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity style={styles.button} onPress={submitReview}>
        <Text style={styles.buttonText}>SUBMIT REVIEW</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#023F0F', padding: 20 },
  skip: { position: 'absolute', top: 40, right: 20 },
  skipText: { color: 'white', fontWeight: 'bold' },
  title: { fontSize: 22, color: 'white', fontWeight: 'bold', marginTop: 80, marginBottom: 20 },
  stars: { flexDirection: 'row', marginBottom: 20 },
  star: { fontSize: 36, color: '#444' },
  starActive: { color: '#FFD700' },
  input: { height: 100, backgroundColor: '#1A3620', borderRadius: 10, padding: 10, color: 'white' },
  button: { backgroundColor: '#00D964', padding: 14, marginTop: 20, borderRadius: 20, alignItems: 'center' },
  buttonText: { color: '#023F0F', fontWeight: 'bold' },
});
