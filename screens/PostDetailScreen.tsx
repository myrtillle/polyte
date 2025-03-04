import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // Adjust the import path as necessary

type PostDetailScreenProps = {
  route: RouteProp<RootStackParamList, 'PostDetail'>;
  navigation: StackNavigationProp<RootStackParamList, 'PostDetail'>;
};

export default function PostDetailScreen({ route }: PostDetailScreenProps) {
  const { postId } = route.params; // Assuming you're passing postId as a parameter

  return (
    <View style={styles.container}>
      <Text>Post Detail Screen</Text>
      <Text>Post ID: {postId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});