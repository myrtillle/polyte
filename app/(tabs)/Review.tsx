import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const getLabel = (stars: number) => {
    if (stars >= 5) return 'Excellent';
    if (stars === 4) return 'Good';
    if (stars === 3) return 'Average';
    return 'Poor';
  };

  const renderStars = (count: number) => {
    const fullStars = Math.floor(count);
    const hasHalfStar = count % 1 >= 0.5;
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '⭐' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  };


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

  useEffect(() => {
    loadReviews();
  }, []);
    

  if (loading) return <ActivityIndicator size="large" color="#00FF57" style={{ marginTop: 50 }} />;

  const totalReviews = reviews.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#023F0F' }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00FF57"
          />
        }
      >
        <Text style={styles.header}>Customer Feedback</Text>
        <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
        <Text style={styles.stars}>{renderStars(averageRating)}</Text>
        <Text style={styles.total}>Based on {totalReviews} reviews</Text>

        <View style={styles.barContainer}>
          {Object.entries(ratingsBreakdown).map(([label, count]) => (
            <View key={label} style={styles.barRow}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / totalReviews) * 100 || 0}%` }]} />
              </View>
              <Text style={styles.count}>{count}</Text>
            </View>
          ))}
        </View>

        {reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewer}>
                {review.reviewer?.first_name} {review.reviewer?.last_name}
              </Text>
              <Text style={styles.date}>
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
            <Text style={styles.reviewText}>{review.comment}</Text>
          </View>
        ))}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center',
  },
  rating: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  stars: {
    textAlign: 'center',
    fontSize: 24,
    color: '#FFD700',
    marginBottom: 5,
  },
  total: {
    textAlign: 'center',
    color: '#aaa',
    marginBottom: 20,
  },
  barContainer: {
    marginBottom: 30,
    backgroundColor: '#1A3620',
    padding: 15,
    borderRadius: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 80,
    color: '#fff',
    fontSize: 12,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#2A4620',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  barFill: {
    height: 8,
    backgroundColor: '#00FF66',
  },
  count: {
    color: '#aaa',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: '#1A3620',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewer: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#aaa',
  },
  reviewStars: {
    fontSize: 18,
    color: '#FFD700',
    marginVertical: 5,
  },
  reviewText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});

export default Review;