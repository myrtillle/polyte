import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const TestScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>This is a Test Screen</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TestScreen; 