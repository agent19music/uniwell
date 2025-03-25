import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { useColorScheme } from 'react-native';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase
        .from('post_tags')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error) setTags(data);
    };
    fetchTags();
  }, []);

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onTagsChange(newTags);
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={tags}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tag,
              { backgroundColor: item.color },
              selectedTags.includes(item.id) && styles.selectedTag,
              isDark && styles.tagDark
            ]}
            onPress={() => toggleTag(item.id)}
          >
            <Text style={[
              styles.tagText,
              selectedTags.includes(item.id) && styles.selectedTagText
            ]}>
              #{item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.tagList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  tagList: {
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tagDark: {
    backgroundColor: '#2a2a2a',
  },
  selectedTag: {
    borderWidth: 2,
    borderColor: '#FF7F50',
  },
  tagText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Vercetti-Regular',
  },
  selectedTagText: {
    fontWeight: '600',
    color: '#FF7F50',
  },
}); 