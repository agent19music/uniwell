import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Article, Headphones, VideoCamera, BookOpen, BookmarkSimple } from 'phosphor-react-native';
import { useTheme } from '../hooks/useTheme';

interface ResourceCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'article' | 'podcast' | 'video' | 'book';
  duration: string;
  source: string;
  isNew: boolean;
  isSaved: boolean;
  onPress: (id: string) => void;
  onSave: (id: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  type,
  duration,
  source,
  isNew,
  isSaved,
  onPress,
  onSave
}) => {
  const { colors, isDark } = useTheme();
  
  const getTypeIcon = () => {
    switch (type) {
      case 'article':
        return <Article size={16} color={colors.textSecondary} weight="regular" />;
      case 'podcast':
        return <Headphones size={16} color={colors.textSecondary} weight="regular" />;
      case 'video':
        return <VideoCamera size={16} color={colors.textSecondary} weight="regular" />;
      case 'book':
        return <BookOpen size={16} color={colors.textSecondary} weight="regular" />;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.resourceCard,
        { 
          backgroundColor: colors.card,
          shadowColor: colors.shadow.medium
        }
      ]} 
      onPress={() => onPress(id)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.resourceImage} 
        resizeMode="cover"
      />
      
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceTypeContainer}>
            {getTypeIcon()}
            <Text style={[styles.resourceType, { color: colors.textSecondary }]}>
              {type}
            </Text>
          </View>
          
          {isNew && (
            <View style={[styles.newBadge, { backgroundColor: colors.success }]}>
              <Text style={[styles.newBadgeText, { color: colors.background }]}>NEW</Text>
            </View>
          )}
        </View>
        
        <Text 
          style={[styles.resourceTitle, { color: colors.textPrimary }]} 
          numberOfLines={2}
        >
          {title}
        </Text>
        
        <Text 
          style={[styles.resourceDescription, { color: colors.textSecondary }]} 
          numberOfLines={2}
        >
          {description}
        </Text>
        
        <View style={styles.resourceFooter}>
          <Text style={[styles.resourceDuration, { color: colors.textTertiary }]}>
            {duration}
          </Text>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => onSave(id)}
          >
            <BookmarkSimple 
              size={22} 
              color={isSaved ? colors.primary : colors.textSecondary} 
              weight={isSaved ? "fill" : "regular"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  resourceCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resourceImage: {
    width: '100%',
    height: 160,
  },
  resourceContent: {
    padding: 14,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resourceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceType: {
    fontSize: 12,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resourceTitle: {
    fontSize: 17,
    fontFamily: 'Vercetti-Regular',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  resourceDescription: {
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
    marginBottom: 12,
    lineHeight: 20,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resourceDuration: {
    fontSize: 13,
    fontFamily: 'Vercetti-Regular',
  },
  saveButton: {
    padding: 4,
  },
});

// Using React.memo to prevent unnecessary re-renders
export default memo(ResourceCard); 