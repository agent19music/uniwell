import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Menu } from './Menu';
import { CircularVideoPlayer } from './CircularVideoPlayer';
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

// Color definitions
const COLORS = {
  pink: {
    gradient: ['#FDF2F8', '#FCE7F3'],
    border: '#FBCFE8',
    button: '#EC4899',
    buttonHover: '#DB2777',
  },
  blue: {
    gradient: ['#EFF6FF', '#DBEAFE'],
    border: '#BFDBFE',
    button: '#3B82F6',
    buttonHover: '#2563EB',
  },
  yellow: {
    gradient: ['#FEF9C3', '#FEF3C7'],
    border: '#FDE68A',
    button: '#EAB308',
    buttonHover: '#CA8A04',
  },
  green: {
    gradient: ['#DCFCE7', '#D1FAE5'],
    border: '#BBF7D0',
    button: '#22C55E',
    buttonHover: '#16A34A',
  },
  purple: {
    gradient: ['#F3E8FF', '#E9D5FF'],
    border: '#D8B4FE',
    button: '#A855F7',
    buttonHover: '#9333EA',
  },
  orange: {
    gradient: ['#FFEDD5', '#FED7AA'],
    border: '#FDBA74',
    button: '#F97316',
    buttonHover: '#EA580C',
  },
};

type ColorType = keyof typeof COLORS;

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
          <Pause size={24} color="#FFFFFF" weight="fill" />
        ) : (
          <Play size={24} color="#FFFFFF" weight="fill" />
        )}
      </TouchableOpacity>
      
      <View style={styles.waveformContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: `${progress}%`,
            backgroundColor: colorScheme.button 
          }]} />
        </View>
        <Text style={styles.duration}>
          {duration > 0 ? `${Math.floor(currentTime)}s / ${Math.floor(duration)}s` : 'Voice Note'}
        </Text>
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

  // Cycle through colors based on index
  const colorKeys = Object.keys(COLORS) as ColorType[];
  const colorKey = colorKeys[index % colorKeys.length];
  const colorScheme = COLORS[colorKey];
  
  // Create staggered rotation effect
  const rotation = index % 2 === 0 ? '-2deg' : '2deg';

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
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => setMenuVisible(true)}
          onPress={() => setDialogVisible(true)}
          style={[
            styles.card,
            { 
              backgroundColor: colorScheme.gradient[0],
              borderColor: colorScheme.border,
              transform: [{ rotate: rotation }]
            }
          ]}
        >
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              {item.is_pinned && (
                 <PushPin size={14} weight="fill" style={{ marginRight: 6, marginTop: 2 }} />
              )}
           {item.title &&   <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>}
              <Text style={styles.dateCorner}>{dateStr}</Text>
            </View>
            <Text style={styles.timestamp}>
              {timeStr} · {dayStr}
            </Text>
          </View>

          {/* Content Section */}
          {item.type === 'voice' ? (
            <VoicePlayer uri={item.content} colorScheme={colorScheme} />
          ) : item.type === 'video' ? (
            <View style={styles.videoContainer}>
              <CircularVideoPlayer uri={item.content} colorScheme={colorScheme} size={100} />
            </View>
          ) : (
            <Text style={styles.cardContent} numberOfLines={4}>
              {item.content}
            </Text>
          )}
        </TouchableOpacity>
      }
    />
    
    {/* Journal Detail Dialog */}
    <Modal
      visible={dialogVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDialogVisible(false)}
    >
      <View style={styles.dialogOverlay}>
        <View style={[
          styles.dialogContent,
          { backgroundColor: colorScheme.gradient[0], borderColor: colorScheme.border }
        ]}>
          <View style={styles.dialogHeader}>
            <View style={{ flex: 1 }}>
              {item.title && (
                <Text style={styles.dialogTitle}>{item.title}</Text>
              )}
              <Text style={styles.dialogDate}>
                {dateStr} · {timeStr} · {dayStr}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDialogVisible(false)} style={styles.closeButton}>
              <X size={24} color="#1F2937" weight="bold" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.dialogBody}
            showsVerticalScrollIndicator={true}
          >
            {item.type === 'voice' ? (
              <VoicePlayer uri={item.content} colorScheme={colorScheme} />
            ) : item.type === 'video' ? (
              <View style={styles.dialogVideoContainer}>
                <CircularVideoPlayer uri={item.content} colorScheme={colorScheme} size={240} />
              </View>
            ) : (
              <Text style={styles.dialogText}>{item.content}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - 48) / 2, // Two columns with spacing
    minHeight: 160,
    maxHeight: 200,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 18,
    flex: 1,
    fontFamily: 'Vercetti-Regular',
  },
  dateCorner: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6B7280',
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
    fontWeight: '500',
    fontFamily: 'Vercetti-Regular',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  waveformContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  duration: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 4,
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Vercetti-Regular',
    marginBottom: 4,
  },
  dialogDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  dialogBody: {
    padding: 20,
    maxHeight: 400,
  },
  dialogText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    fontFamily: 'Vercetti-Regular',
  },
  dialogVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});
