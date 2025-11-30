import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Categories for content
const CONTENT_CATEGORIES = [
  { id: 'featured', label: 'Featured' },
  { id: 'streak-related', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'New' },
  { id: 'saved', label: 'Saved' },
];

interface LibraryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const LibraryFilter = ({ selectedCategory, onSelectCategory }: LibraryFilterProps) => {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsContainer}
      decelerationRate="fast"
      snapToAlignment="center"
    >
      {CONTENT_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryTab,
            { backgroundColor: colors.input.background },
            selectedCategory === category.id && { backgroundColor: colors.primary }
          ]}
          onPress={() => onSelectCategory(category.id)}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.categoryTabText,
              { 
                color: selectedCategory === category.id ? colors.background : colors.textSecondary,
                fontFamily: 'Vercetti-Regular'
              }
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoryTabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 16,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default memo(LibraryFilter); 