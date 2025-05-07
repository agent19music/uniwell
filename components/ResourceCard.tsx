import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity 
      style={[styles.resourceCard, isDark && styles.darkCard]} 
      onPress={() => onPress(id)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.resourceImage} 
        resizeMode="cover"
      />
      
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceTypeContainer}>
            <Ionicons 
              name={
                type === 'article' ? 'document-text' : 
                type === 'podcast' ? 'headset' : 
                type === 'video' ? 'videocam' : 'book'
              } 
              size={14} 
              color="#FF7F50" 
            />
            <Text style={styles.resourceType}>{type}</Text>
          </View>
          
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.resourceTitle, isDark && styles.darkText]} numberOfLines={2}>
          {title}
        </Text>
        
        <Text style={[styles.resourceDescription, isDark && styles.darkSubText]} numberOfLines={2}>
          {description}
        </Text>
        
        <View style={styles.resourceFooter}>
          <Text style={[styles.resourceDuration, isDark && styles.darkSubText]}>
            {duration}
          </Text>
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => onSave(id)}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isSaved ? "#FF7F50" : isDark ? "#ffffff" : "#333333"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  resourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  resourceImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  resourceContent: {
    padding: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceType: {
    fontSize: 12,
    marginLeft: 4,
    color: '#FF7F50',
    textTransform: 'uppercase',
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceDuration: {
    fontSize: 12,
    color: '#888888',
  },
  saveButton: {
    padding: 4,
  },
  darkText: {
    color: '#ffffff',
  },
  darkSubText: {
    color: '#aaaaaa',
  },
});

// Using React.memo to prevent unnecessary re-renders
export default memo(ResourceCard); 