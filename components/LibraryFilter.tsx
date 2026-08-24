import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeText } from '@/components/ThemedText';
import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabsContainer}
      decelerationRate="fast"
      snapToAlignment="center"
    >
      {CONTENT_CATEGORIES.map(category => (
        <Pressable
          key={category.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedCategory === category.id }}
          onPress={() => onSelectCategory(category.id)}
          style={({ pressed }) => [
            styles.categoryTab,
            {
              backgroundColor: selectedCategory === category.id ? colors.accent : colors.surface,
              borderColor: selectedCategory === category.id ? colors.accent : colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <SafeText variant="label" color={selectedCategory === category.id ? colors.textOnAccent : colors.textSecondary}>
            {category.label}
          </SafeText>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoryTabsContainer: {
    gap: spacing.micro,
    paddingHorizontal: spacing.control,
    paddingBottom: spacing.control,
    paddingTop: spacing.micro,
  },
  categoryTab: {
    borderCurve: 'continuous',
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.control,
  },
});

export default memo(LibraryFilter); 