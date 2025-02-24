import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PostCardProps = {
  post: {
    title: string;
    content: string;
    created_at: string;
    votes: number;
    comments_count: number;
  }
};

export default function PostCard({ post }: PostCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <View style={styles.footer}>
        <Text>Votes: {post.votes}</Text>
        <Text>Comments: {post.comments_count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
}); 