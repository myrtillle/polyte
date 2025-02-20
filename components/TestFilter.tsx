import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

type Props = {
  onFilterChange: (value: string) => void;
};

export function TestFilter({ onFilterChange }: Props) {
  return (
    <View>
      <Text>Test Filter</Text>
      <Button 
        mode="contained" 
        onPress={() => {
          console.log('Button pressed');
          onFilterChange('test');
        }}
      >
        Test Filter
      </Button>
    </View>
  );
} 