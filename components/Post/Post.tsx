import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PostProps {
  user: {
    name: string;
    timePosted: string;
    location?: string;
  };
  collectionType: string;
  itemList: string[];
  description?: string;
  image?: string;
  onMessage: () => void;
  onComment: () => void;
  onMore: () => void;
}

export function Post({
  user,
  collectionType,
  itemList,
  description,
  image,
  onMessage,
  onComment,
  onMore,
}: PostProps) {
  return (
    <Card style={styles.card}>
      <Card.Title
        title={user.name}
        subtitle={`${user.timePosted}${user.location ? ` • ${user.location}` : ''}`}
        left={(props) => (
          <Avatar.Text {...props} label={user.name.charAt(0)} />
        )}
      />
      
      {image && (
        <Card.Cover source={{ uri: image }} style={styles.image} />
      )}
      
      <Card.Content>
        <Chip style={styles.typeChip}>
          {collectionType}
        </Chip>
        
        <View style={styles.itemList}>
          {itemList.map((item, index) => (
            <Chip
              key={index}
              style={styles.itemChip}
              textStyle={styles.itemChipText}
            >
              {item}
            </Chip>
          ))}
        </View>
        
        {description && (
          <Paragraph style={styles.description}>{description}</Paragraph>
        )}
      </Card.Content>

      <Card.Actions style={styles.actions}>
        <Button
          mode="text"
          onPress={onMessage}
          icon={() => <MaterialCommunityIcons name="message" size={20} />}
        >
          Message
        </Button>
        <Button
          mode="text"
          onPress={onComment}
          icon={() => <MaterialCommunityIcons name="comment" size={20} />}
        >
          Comment
        </Button>
        <Button
          mode="text"
          onPress={onMore}
          icon={() => <MaterialCommunityIcons name="dots-vertical" size={20} />}
        >
          More
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  image: {
    height: 200,
  },
  typeChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e8f5e9',
  },
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  itemChip: {
    margin: 4,
    backgroundColor: '#f5f5f5',
  },
  itemChipText: {
    fontSize: 12,
  },
  description: {
    marginTop: 8,
  },
  actions: {
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
}); 