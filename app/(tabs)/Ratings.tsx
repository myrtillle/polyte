import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reviewService } from '@/services/reviewService';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '@/types/navigation';
import { supabase } from '@/services/supabase';
import { transactionService } from '@/services/transactionService';

export default function Ratings() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starScale] = useState([1, 1, 1, 1, 1].map(() => new Animated.Value(1)));
  const navigation = useNavigation<StackNavigationProp<ProfileStackParamList, 'Ratings'>>();
  const { offerId } = useRoute().params as { offerId: string };

  useEffect(() => {
    const fetchTransaction = async () => {
      const data = await transactionService.fetchTransactionDetails(offerId);
      setTransaction(data);
    };
    fetchTransaction();
  }, [offerId]);

  const submitReview = async () => {
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const reviewer_id = userData?.user?.id;
    const reviewed_user_id = transaction?.collector_id || transaction?.offerer_id;
    if (!reviewer_id || !reviewed_user_id) {
      Alert.alert("Error", "Missing user info. Please try again.");
      setSubmitting(false);
      return;
    }
    const success = await reviewService.submitReview({
      offer_id: offerId,
      reviewer_id,
      reviewed_user_id,
      rating,
      comment
    });
    setSubmitting(false);
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

  const handleStarPress = (i: number) => {
    setRating(i);
    Animated.sequence([
      Animated.timing(starScale[i-1], { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(starScale[i-1], { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const userName = transaction?.collector_name || transaction?.offerer_name || 'User';
  const userRole = transaction?.collector_name ? 'Collector' : 'Offerer';
  const userAvatar = transaction?.photo_url || 'https://i.pravatar.cc/80';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.goBack()}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      {/* User Info Card */}
      <View style={styles.userCard}>
        <Image source={{ uri: userAvatar }} style={styles.avatar} />
        <View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userRole}>{userRole}</Text>
        </View>
      </View>
      <Text style={styles.title}>Rate your experience</Text>
      <View style={styles.stars}>
        {[1,2,3,4,5].map((i) => (
          <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.7}>
            <Animated.Text style={[styles.star, i <= rating && styles.starActive, { transform: [{ scale: starScale[i-1] }] }]}>★</Animated.Text>
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
      <TouchableOpacity style={[styles.button, submitting && { opacity: 0.7 }]} onPress={submitReview} disabled={submitting} activeOpacity={0.85}>
        {submitting ? <ActivityIndicator color="#023F0F" /> : <Text style={styles.buttonText}>SUBMIT REVIEW</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#023F0F', padding: 20 },
  skip: { position: 'absolute', top: 40, right: 20, zIndex: 2 },
  skipText: { color: '#00D964', fontWeight: 'bold', fontSize: 16, textDecorationLine: 'underline' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3620',
    borderRadius: 16,
    padding: 16,
    marginTop: 60,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 0,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  userRole: { color: '#00D964', fontSize: 13, marginTop: 2 },
  title: { fontSize: 22, color: 'white', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  stars: { flexDirection: 'row', marginBottom: 20, justifyContent: 'center' },
  star: { fontSize: 40, color: '#444', marginHorizontal: 4 },
  starActive: { color: '#FFD700', textShadowColor: '#FFD70099', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  input: { height: 100, backgroundColor: '#1A3620', borderRadius: 14, padding: 14, color: 'white', fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#235F30' },
  button: { backgroundColor: '#00D964', padding: 16, marginTop: 10, borderRadius: 24, alignItems: 'center', shadowColor: '#00D964', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 3 },
  buttonText: { color: '#023F0F', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
