import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

const Review = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const totalReviews = 20;
  const averageRating = 3.9;
  const ratingsBreakdown = {
    Excellent: 7,
    Good: 6,
    Average: 4,
    Poor: 3,
  };

  const reviews = [
    {
      name: 'Martin Luather',
      stars: 4,
      text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
      date: '2 days ago',
    },
    {
      name: 'Johan Smith Jeo',
      stars: 3,
      text: 'Lorem Ipsum has been the industry’s standard dummy text ever since the 1500s.',
      date: '3 days ago',
    },
  ];

  const renderStars = (count: number) => '⭐'.repeat(count) + '☆'.repeat(5 - count);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Customer Feedback</Text>
      <Text style={styles.rating}>{averageRating.toFixed(1)}</Text>
      <Text style={styles.stars}>{renderStars(Math.round(averageRating))}</Text>
      <Text style={styles.total}>Based on {totalReviews} reviews</Text>

      <View style={styles.barContainer}>
        {Object.entries(ratingsBreakdown).map(([label, count]) => (
          <View key={label} style={styles.barRow}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(count / totalReviews) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>

      {reviews.map((review, index) => (
        <View key={index} style={styles.reviewCard}>
          <Text style={styles.reviewer}>{review.name}</Text>
          <Text style={styles.date}>{review.date}</Text>
          <Text style={styles.reviewStars}>{renderStars(review.stars)}</Text>
          <Text style={styles.reviewText}>{review.text}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.writeButton}>
        <Text style={styles.writeButtonText}>Write a review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rating: {
    fontSize: 50,
    fontWeight: 'bold',
    textAlign: 'center',
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
    backgroundColor: '#00b894',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  writeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Review;