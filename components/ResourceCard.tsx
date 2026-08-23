import React, { memo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Article, Headphones, VideoCamera, BookOpen, BookmarkSimple } from 'phosphor-react-native';
import { SafeText } from '@/components/ThemedText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { spacing, typography } from '@/constants/theme';
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
  const { colors } = useTheme();
  
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
    <Card
      accessibilityLabel={`Open ${title}`}
      onPress={() => onPress(id)}
      style={styles.resourceCard}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={[styles.resourceImage, { borderColor: colors.border }]}
        resizeMode="cover"
      />
      
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceTypeContainer}>
            {getTypeIcon()}
            <SafeText variant="caption" color={colors.textSecondary} style={styles.resourceType}>
              {type}
            </SafeText>
          </View>
          
          {isNew && (
            <Badge label="New" tone="success" />
          )}
        </View>
        
        <SafeText
          variant="bodyStrong"
          style={styles.resourceTitle}
          numberOfLines={2}
        >
          {title}
        </SafeText>
        
        <SafeText
          variant="caption"
          color={colors.textSecondary}
          style={styles.resourceDescription}
          numberOfLines={2}
        >
          {description}
        </SafeText>
        
        <View style={styles.resourceFooter}>
          <SafeText variant="caption" color={colors.textMuted}>
            {duration}
          </SafeText>
          
          <IconButton
            accessibilityLabel={isSaved ? `Remove ${title} from saved resources` : `Save ${title}`}
            onPress={() => onSave(id)}
          >
            <BookmarkSimple 
              size={22} 
              color={isSaved ? colors.accent : colors.textSecondary}
              weight={isSaved ? "fill" : "regular"} 
            />
          </IconButton>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  resourceCard: {
    marginBottom: 12,
    padding: 0,
  },
  resourceImage: {
    borderBottomWidth: 1,
    width: '100%',
    height: 160,
  },
  resourceContent: {
    gap: spacing.micro,
    padding: spacing.control,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.optical,
  },
  resourceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.optical,
  },
  resourceType: { textTransform: 'capitalize' },
  resourceTitle: {
    ...typography.bodyStrong,
  },
  resourceDescription: {
    marginBottom: spacing.optical,
  },
  resourceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.optical,
  },
});

// Using React.memo to prevent unnecessary re-renders
export default memo(ResourceCard); 