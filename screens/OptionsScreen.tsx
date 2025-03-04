import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // Adjust the path as necessary

// Define the props for the OptionsScreen
type OptionsScreenProps = {
  route: RouteProp<RootStackParamList, 'Options'>; // Define the route type
  navigation: StackNavigationProp<RootStackParamList, 'Options'>; // Define the navigation type
};

// Create the OptionsScreen component
const OptionsScreen: React.FC<OptionsScreenProps> = ({ route, navigation }) => {
  const { post } = route.params; // Get the post data passed from the previous screen

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Options for {post.description}</Text>
      <Button title="Option 1" onPress={() => {/* Handle option 1 */}} />
      <Button title="Option 2" onPress={() => {/* Handle option 2 */}} />
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

// Define styles for the OptionsScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default OptionsScreen; 