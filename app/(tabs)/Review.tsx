import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import { supabase } from '@/services/supabase';

const Review = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsBreakdown, setRatingsBreakdown] = useState({ Excellent: 0, Good: 0, Average: 0, Poor: 0 });

  const getLabel = (stars: number) => {
    if (stars >= 5) return 'Excellent';
    if (stars === 4) return 'Good';
    if (stars === 3) return 'Average';
    return 'Poor';
  };

  const renderStars = (count: number) => '⭐'.repeat(count) + '☆'.repeat(5 - count);

  useEffect(() => {
    const loadReviews = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:reviewer_id ( first_name, last_name )')
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to load reviews:', error.message);
      } else {
        setReviews(data || []);

        const total = data.length;
        const totalScore = data.reduce((sum, r) => sum + (r.rating || 0), 0);
        setAverageRating(total ? totalScore / total : 0);

        const breakdown = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
        for (let r of data) {
          const label = getLabel(r.rating);
          breakdown[label]++;
        }
        setRatingsBreakdown(breakdown);
      }

      setLoading(false);
    };

    loadReviews();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#00FF57" style={{ marginTop: 50 }} />;

  const totalReviews = reviews.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#023F0F' }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <Text style={styles.header}>Customer Feedback</Text>
        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
        <Text style={styles.stars}>{renderStars(Math.round(averageRating))}</Text>
        <Text style={styles.total}>Based on {totalReviews} reviews</Text>

        <View style={styles.barContainer}>
          {Object.entries(ratingsBreakdown).map(([label, count]) => (
            <View key={label} style={styles.barRow}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / totalReviews) * 100 || 0}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <Text style={styles.reviewer}>
              {review.reviewer?.first_name} {review.reviewer?.last_name}
            </Text>
            <Text style={styles.date}>
              {new Date(review.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
            <Text style={styles.reviewText}>{review.comment}</Text>
          </View>
        ))}

        {/* <TouchableOpacity style={styles.writeButton}>
          <Text style={styles.writeButtonText}>Write a review</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#023F0F',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff'
  },
  rating: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  stars: {
    textAlign: 'center',
    fontSize: 20,
    color: '#f5a623',
  },
  total: {
    textAlign: 'center',
    color: '#777',
    marginBottom: 20,
  },
  barContainer: {
    marginBottom: 30,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 70,
    color: '#fff',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    backgroundColor: '#00b894',
  },
  reviewCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  reviewer: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  reviewStars: {
    fontSize: 18,
    color: '#f5a623',
    marginVertical: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  writeButton: {
    backgroundColor: '#00FF57',
    padding: 14,
    borderRadius: 40,
    marginTop: 10,
    alignItems: 'center',
    
  },
  writeButtonText: {
    // color: '#fff',
    fontWeight: 'bold',
    color: '#132718',
  },
});

export default Review;