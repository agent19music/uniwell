import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

interface FeaturedCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'article' | 'podcast' | 'video' | 'book';
  onPress: (id: string) => void;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  type,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => onPress(id)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredTypeContainer}>
            <Ionicons 
              name={
                type === 'article' ? 'document-text' : 
                type === 'podcast' ? 'headset' : 
                type === 'video' ? 'videocam' : 'book'
              } 
              size={14} 
              color="#ffffff" 
            />
            <Text style={styles.featuredType}>{type}</Text>
          </View>
          
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {title}
          </Text>
          
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  featuredCard: {
    width: CARD_WIDTH,
    height: 220,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: 16,
  },
  featuredTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredType: {
    fontSize: 12,
    marginLeft: 4,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default memo(FeaturedCard); 