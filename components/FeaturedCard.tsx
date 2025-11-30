import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Article, Headphones, VideoCamera, BookOpen } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

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
  const { colors } = useTheme();
  
  const getTypeIcon = () => {
    switch (type) {
      case 'article':
        return <Article size={14} color="#FFFFFF" weight="regular" />;
      case 'podcast':
        return <Headphones size={14} color="#FFFFFF" weight="regular" />;
      case 'video':
        return <VideoCamera size={14} color="#FFFFFF" weight="regular" />;
      case 'book':
        return <BookOpen size={14} color="#FFFFFF" weight="regular" />;
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => onPress(id)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: imageUrl }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredTypeContainer}>
            {getTypeIcon()}
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
    height: 240,
    marginRight: 12,
    borderRadius: 16,
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
    gap: 6,
  },
  featuredType: {
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
    color: '#ffffff',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  featuredTitle: {
    fontSize: 19,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 24,
  },
  featuredDescription: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
  },
});

export default memo(FeaturedCard); 