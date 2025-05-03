import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { Card } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

type CommentScreenRouteProp = RouteProp<RootStackParamList, 'Comment'>;
type CommentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Comment'>;

type Props = {
  route: CommentScreenRouteProp;
  navigation: CommentScreenNavigationProp;
};

const CommentScreen = ({ route }: Props) => {
  const { post } = route.params || {}; // Use optional chaining to avoid errors

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>No post data available.</Text>
      </View>
    );
  }

  const [comments, setComments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, newComment]);
      setNewComment('');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.postTitle}>{post.description}</Text>
          <Text style={styles.postDetails}>{post.user_id} - {post.created_at}</Text>
          {post.photos && post.photos.length > 0 && (
            <Card.Cover source={{ uri: post.photos[0] }} style={styles.postImage} />
          )}
        </Card.Content>
      </Card>

      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>{item}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        value={newComment}
        onChangeText={setNewComment}
      />
      <Button title="Send Comment" onPress={handleAddComment} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1A3620',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#2C5735',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  postDetails: {
    color: '#ccc',
  },
  postImage: {
    marginVertical: 8,
    borderRadius: 8,
  },
  commentContainer: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#2C5735',
    borderRadius: 4,
  },
  commentText: {
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
});

export default CommentScreen; 