import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Menu } from './Menu';
import { CircularVideoPlayer } from './CircularVideoPlayer';
import { SafeText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/Badge';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry } from '../types/journal';
import { 
  PushPin, 
  Play, 
  Pause, 
  X,
  Pencil,
  Trash,
  PushPinSlash 
} from 'phosphor-react-native';

const { width } = Dimensions.get('window');

const VoicePlayer = ({ uri, colorScheme }: { uri: string, colorScheme: any }) => {
  const player = useAudioPlayer({ uri });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Update progress and time
  useEffect(() => {
    const interval = setInterval(() => {
      if (player.duration > 0) {
        setDuration(player.duration);
        setCurrentTime(player.currentTime);
        const currentProgress = (player.currentTime / player.duration) * 100;
        setProgress(currentProgress);
      }
      setIsPlaying(player.playing);
    }, 100);
    
    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };
  
  return (
    <View style={styles.voiceContainer}>
      <TouchableOpacity
        style={[
          styles.playButton,
          { backgroundColor: colorScheme.button }
        ]}
        onPress={togglePlayback}
        activeOpacity={0.8}
      >
        {isPlaying ? (
          <Pause size={24} color={colorScheme.textOnAccent} weight="fill" />
        ) : (
          <Play size={24} color={colorScheme.textOnAccent} weight="fill" />
        )}
      </TouchableOpacity>
      
      <View style={styles.waveformContainer}>
        <View style={[styles.progressBar, { backgroundColor: colorScheme.surfacePressed }]}>
          <View style={[styles.progressFill, { 
            width: `${progress}%`,
            backgroundColor: colorScheme.button 
          }]} />
        </View>
        <SafeText variant="caption" color={colorScheme.textMuted} style={styles.duration}>
          {duration > 0 ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s` : 'Voice Note'}
        </SafeText>
      </View>
    </View>
  );
};

export const JournalCard = ({ 
  item, 
  onPin, 
  onDelete, 
  onEdit,
  index
}: { 
  item: JournalEntry, 
  onPin: (id: string, current: boolean) => void, 
  onDelete: (id: string) => void, 
  onEdit: (item: JournalEntry) => void,
  index: number
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const { colors } = useTheme();
  const colorScheme = {
    button: colors.accent,
    gradient: [colors.surfaceRaised, colors.surfaceRaised],
    surfacePressed: colors.surfacePressed,
    textOnAccent: colors.textOnAccent,
    textMuted: colors.textMuted,
  };

  const dateObj = new Date(item.timestamp || item.created_at);
  const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const dayStr = dateObj.toLocaleDateString(undefined, { weekday: 'short' });

  const menuItems = [
    {
      label: item.is_pinned ? 'Unpin' : 'Pin',
      icon: item.is_pinned ? 'pin-slash-outline' : 'pin-outline',
      onPress: () => {
        onPin(item.id, item.is_pinned);
        setMenuVisible(false);
      }
    },
    {
      label: 'Edit',
      icon: 'create-outline',
      onPress: () => {
        onEdit(item);
        setMenuVisible(false);
      }
    },
    {
      label: 'Delete',
      icon: 'trash-outline',
      onPress: () => {
        onDelete(item.id);
        setMenuVisible(false);
      }
    }
  ];

  return (
    <>
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      items={menuItems}
      trigger={
        <Card
          accessibilityLabel={`Open journal entry from ${dateStr}`}
          onLongPress={() => setMenuVisible(true)}
          onPress={() => setDialogVisible(true)}
          style={styles.card}
        >
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              {item.is_pinned && (
                 <PushPin size={14} color={colors.accent} weight="fill" />
              )}
           {item.title && <SafeText variant="bodyStrong" style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </SafeText>}
              <SafeText variant="caption" color={colors.textMuted} style={styles.dateCorner}>{dateStr}</SafeText>
            </View>
            <SafeText variant="caption" color={colors.textMuted}>
              {timeStr} · {dayStr}
            </SafeText>
          </View>
          {item.is_pinned && <StatusBadge label="Pinned" status="success" />}

          {/* Content Section */}
          {item.type === 'voice' ? (
            <VoicePlayer uri={item.content} colorScheme={colorScheme} />
          ) : item.type === 'video' ? (
            <View style={styles.videoContainer}>
              <CircularVideoPlayer uri={item.content} colorScheme={colorScheme} size={100} />
            </View>
          ) : (
            <SafeText variant="caption" color={colors.textSecondary} style={styles.cardContent} numberOfLines={4}>
              {item.content}
            </SafeText>
          )}
        </Card>
      }
    />
    
    {/* Journal Detail Dialog */}
    <Dialog
      visible={dialogVisible}
      onClose={() => setDialogVisible(false)}
      dismissible
      scrollable={false}
      title={item.title || 'Journal entry'}
      description={`${dateStr} · ${timeStr} · ${dayStr}`}
    >
          <View style={styles.dialogHeader}>
            <IconButton accessibilityLabel="Close journal entry" onPress={() => setDialogVisible(false)}>
              <X size={24} color={colors.text} weight="bold" />
            </IconButton>
          </View>
          <ScrollView style={styles.dialogBody} showsVerticalScrollIndicator>
            {item.type === 'voice' ? (
              <VoicePlayer uri={item.content} colorScheme={colorScheme} />
            ) : item.type === 'video' ? (
              <View style={styles.dialogVideoContainer}>
                <CircularVideoPlayer uri={item.content} colorScheme={colorScheme} size={240} />
              </View>
            ) : (
              <SafeText variant="body" style={styles.dialogText}>{item.content}</SafeText>
            )}
          </ScrollView>
    </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - spacing.page) / 2,
    minHeight: 160,
    maxHeight: 200,
    marginBottom: spacing.control,
  },
  cardHeader: {
    marginBottom: spacing.micro,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.optical,
    gap: spacing.optical,
  },
  cardTitle: {
    ...typography.bodyStrong,
    flex: 1,
  },
  dateCorner: {
    marginTop: 2,
  },
  cardContent: {
    lineHeight: typography.caption.lineHeight,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.micro,
    paddingVertical: spacing.micro,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  duration: {
    marginTop: spacing.optical,
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.micro,
  },
  dialogHeader: {
    alignItems: 'flex-end',
  },
  dialogBody: {
    maxHeight: 400,
  },
  dialogText: {
    ...typography.body,
  },
  dialogVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.control,
  },
});
