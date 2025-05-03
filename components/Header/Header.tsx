import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Appbar, Searchbar, useTheme } from 'react-native-paper';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  const handleNotification = () => {
    // TODO: Implement notification functionality
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Image
          source={require('../../assets/logo.png')} // You'll need to add this logo
          style={styles.logo}
          resizeMode="contain"
        />
        <Appbar.Action 
          icon="bell" 
          color={theme.colors.primary}
          onPress={handleNotification} 
        />
      </Appbar.Header>
      <Searchbar
        placeholder="Search posts..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    elevation: 4,
  },
  header: {
    justifyContent: 'space-between',
    elevation: 0,
  },
  logo: {
    height: 30,
    width: 100,
  },
  searchBar: {
    margin: 8,
    elevation: 0,
  },
}); 