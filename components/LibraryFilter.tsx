import React, { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';

// Categories for content
const CONTENT_CATEGORIES = [
  { id: 'featured', label: 'Featured For You' },
  { id: 'streak-related', label: 'Based On Your Streaks' },
  { id: 'trending', label: 'Trending Now' },
  { id: 'new', label: 'New Additions' },
  { id: 'saved', label: 'Saved Items' },
];

interface LibraryFilterProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const LibraryFilter = ({ selectedCategory, onSelectCategory }: LibraryFilterProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
            selectedCategory === category.id && styles.selectedCategoryTab,
            isDark && styles.darkCategoryTab,
            selectedCategory === category.id && isDark && styles.darkSelectedCategoryTab
          ]}
          onPress={() => onSelectCategory(category.id)}
          activeOpacity={0.7}
        >
          <Text 
            style={[
              styles.categoryTabText,
              selectedCategory === category.id && styles.selectedCategoryTabText,
              isDark && styles.darkText
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  darkCategoryTab: {
    backgroundColor: '#333333',
  },
  darkSelectedCategoryTab: {
    backgroundColor: '#FF7F50',
  },
  categoryTabText: {
    fontWeight: '500',
  },
  selectedCategoryTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  darkText: {
    color: '#ffffff',
  },
});

export default memo(LibraryFilter); 