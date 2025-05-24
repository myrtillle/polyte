// PointsEarnedScreen.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList, RootStackParamList

 } from '@/types/navigation';
const screenHeight = Dimensions.get('window').height;

type NavigationProp = StackNavigationProp<ProfileStackParamList, 'TransaCompleted'>;

export default function TransaCompleted() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { weight, points, offerId } = route.params as { weight: number; points: number; offerId: string };



  const pulse = useRef(new Animated.Value(1)).current;
  const slideUp = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    // Slide up animation
    Animated.timing(slideUp, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideUp }] }]}>
      <Text style={styles.header}>🎉 Transaction Complete!</Text>
      <Animated.Image
        source={require('../../assets/images/polys_symbol.png')}
        style={[styles.image, { transform: [{ scale: pulse }] }]}
        resizeMode="contain"
      />
      <Text style={styles.pointsText}>+{points} polys</Text>
      <Text style={styles.messageText}>
        You have earned {points} points for the {weight} kilograms you offered.
      </Text>
      <Text style={styles.messageText}>Thank you for recycling with Poly.te! 🌱</Text>

      <TouchableOpacity
        style ={{
          backgroundColor: '#00D964',
          paddingVertical: 12,
          paddingHorizontal: 28,
          borderRadius: 24,
          marginTop: 20,
        }}
        onPress={() => navigation.navigate('Ratings', { offerId: offerId })}
        >
        <Text style={{ color: '#023F0F', fontWeight: 'bold' }}>LEAVE A REVIEW</Text>
      </TouchableOpacity>
    </Animated.View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#023F0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  pointsText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D964',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
});
