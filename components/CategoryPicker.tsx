import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';

import { RequestCategory } from '../types/request';
import { CATEGORIES } from '../constants/categories';

type Props = {
  value: RequestCategory[];
  onChange: (categories: RequestCategory[]) => void;
  disabled?: boolean;
};

export function CategoryPicker({ value, onChange, disabled }: Props) {
  const toggleCategory = (category: RequestCategory) => {
    if (value.includes(category)) {
      onChange(value.filter(c => c !== category));
    } else {
      onChange([...value, category]);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={styles.label}>Categories</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((category) => (
          <Chip
            key={category.value}
            selected={value.includes(category.value)}
            onPress={() => toggleCategory(category.value)}
            icon={category.icon}
            disabled={disabled}
            style={[
              styles.chip,
              {
                backgroundColor: value.includes(category.value) 
                  ? category.color 
                  : category.backgroundColor,
              }
            ]}
            textStyle={{
              color: value.includes(category.value) ? 'white' : category.color,
            }}
          >
            {category.label}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
}); 