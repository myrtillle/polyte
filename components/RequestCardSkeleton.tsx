import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence,
  withTiming,
  useSharedValue,
  withDelay
} from 'react-native-reanimated';

export function RequestCardSkeleton() {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(
          Math.random() * 500,
          withTiming(0.7, { duration: 1000 })
        ),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Animated.View style={[styles.chip, animatedStyle]} />
          <Animated.View style={[styles.icon, animatedStyle]} />
        </View>

        <Animated.View style={[styles.title, animatedStyle]} />
        <Animated.View style={[styles.description, animatedStyle]} />
        <Animated.View style={[styles.description, animatedStyle]} />

        <View style={styles.footer}>
          <Animated.View style={[styles.date, animatedStyle]} />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chip: {
    width: 80,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  title: {
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  description: {
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
    width: '80%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  date: {
    width: 80,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
}); 