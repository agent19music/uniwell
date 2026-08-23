import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  useColorScheme,
  PanResponder,
  Animated,
  ScrollView,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { Svg, Path, G, Defs, Pattern, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { PlusCircle, Palette, Sparkle, GridFour, ArrowCounterClockwise, ArrowClockwise, ArrowsCounterClockwise, FloppyDisk } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ILLUSTRATIONS } from '@/data/illustrations';
import Confetti from 'react-native-confetti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 40; // 20px padding on each side

// Color palette with 12 carefully selected colors
const COLOR_PALETTE = [
  { id: '1', color: '#FF69B4', name: 'Pink' },
  { id: '2', color: '#87CEEB', name: 'Sky Blue' },
  { id: '3', color: '#98FB98', name: 'Mint' },
  { id: '4', color: '#DDA0DD', name: 'Plum' },
  { id: '5', color: '#F0E68C', name: 'Khaki' },
  { id: '6', color: '#FF7F50', name: 'Coral' },
  { id: '7', color: '#4682B4', name: 'Steel Blue' },
  { id: '8', color: '#32CD32', name: 'Lime Green' },
  { id: '9', color: '#FFD700', name: 'Gold' },
  { id: '10', color: '#FF4500', name: 'Orange Red' },
  { id: '11', color: '#9370DB', name: 'Medium Purple' },
  { id: '12', color: '#20B2AA', name: 'Light Sea Green' },
];

// Pattern definitions
const PATTERNS = [
  {
    id: 'dots',
    name: 'Dots',
    pattern: (
      <Pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10">
        <Circle cx="2" cy="2" r="1" fill="currentColor" />
      </Pattern>
    ),
  },
  {
    id: 'stripes',
    name: 'Stripes',
    pattern: (
      <Pattern id="stripes" patternUnits="userSpaceOnUse" width="10" height="10">
        <Rect x="0" y="0" width="2" height="10" fill="currentColor" />
      </Pattern>
    ),
  },
  {
    id: 'grid',
    name: 'Grid',
    pattern: (
      <Pattern id="grid" patternUnits="userSpaceOnUse" width="10" height="10">
        <Rect x="0" y="0" width="1" height="10" fill="currentColor" />
        <Rect x="0" y="0" width="10" height="1" fill="currentColor" />
      </Pattern>
    ),
  },
];

interface ColoringCanvasProps {
  onSave?: (uri: string) => void;
}

export default function ColoringCanvas({ onSave }: ColoringCanvasProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].color);
  const [currentIllustration, setCurrentIllustration] = useState(ILLUSTRATIONS[0]);
  const [coloredSections, setColoredSections] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<Array<Record<string, string>>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [scale, setScale] = useState(1);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [isMagicWandActive, setIsMagicWandActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [zoomScale] = useState(new Animated.Value(1));
  const canvasRef = useRef<View>(null);
  const confettiRef = useRef<any>(null);

  // Pan and zoom handling with improved gesture control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.numberActiveTouches === 2) {
          // Pinch to zoom
          const newScale = Math.max(1, Math.min(3, scale + gestureState.dy / 100));
          setScale(newScale);
          Animated.spring(zoomScale, {
            toValue: newScale,
            useNativeDriver: true,
            friction: 3,
            tension: 40,
          }).start();
        }
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  // Add to history with improved state management
  const addToHistory = (newState: Record<string, string>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Add to color history
  const addToColorHistory = (color: string) => {
    setColorHistory(prev => {
      const newHistory = [color, ...prev.filter(c => c !== color)].slice(0, 8);
      return newHistory;
    });
  };

  // Magic wand tool implementation
  const handleMagicWand = (sectionId: string) => {
    if (!isMagicWandActive) return;

    const section = currentIllustration.sections.find(s => s.id === sectionId);
    if (!section) return;

    const group = section.group;
    if (!group) return;

    const newColoredSections = { ...coloredSections };
    currentIllustration.sections
      .filter(s => s.group === group)
      .forEach(s => {
        newColoredSections[s.id] = selectedColor;
      });

    setColoredSections(newColoredSections);
    addToHistory(newColoredSections);
    addToColorHistory(selectedColor);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Color section with pattern support
  const handleColorSection = (sectionId: string) => {
    if (isEyedropperActive) {
      const currentColor = coloredSections[sectionId] || '#FFFFFF';
      setSelectedColor(currentColor);
      setIsEyedropperActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (isMagicWandActive) {
      handleMagicWand(sectionId);
      return;
    }

    const newColoredSections = {
      ...coloredSections,
      [sectionId]: selectedColor,
    };
    
    setColoredSections(newColoredSections);
    addToHistory(newColoredSections);
    addToColorHistory(selectedColor);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check if all sections are colored
    const allSectionsColored = currentIllustration.sections.every(
      section => newColoredSections[section.id]
    );

    if (allSectionsColored) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Undo with haptic feedback
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setColoredSections(history[historyIndex - 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Redo with haptic feedback
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setColoredSections(history[historyIndex + 1]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Reset with success haptic
  const handleReset = () => {
    setColoredSections({});
    addToHistory({});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Save with improved error handling
  const handleSave = async () => {
    if (!canvasRef.current) return;

    try {
      const uri = await captureRef(canvasRef, {
        format: 'png',
        quality: 1,
      });
      
      if (onSave) {
        onSave(uri);
      } else {
        await Sharing.shareAsync(uri);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving illustration:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Change illustration with state reset
  const handleChangeIllustration = (illustration: typeof ILLUSTRATIONS[0]) => {
    setCurrentIllustration(illustration);
    setColoredSections({});
    setHistory([]);
    setHistoryIndex(-1);
    setScale(1);
    setSelectedPattern(null);
    setIsMagicWandActive(false);
    setIsEyedropperActive(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      {/* Illustration Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.illustrationSelector}
      >
        {ILLUSTRATIONS.map((illustration) => (
          <TouchableOpacity
            key={illustration.id}
            style={[
              styles.illustrationOption,
              currentIllustration.id === illustration.id && styles.selectedIllustration,
            ]}
            onPress={() => handleChangeIllustration(illustration)}
            accessibilityLabel={`Select ${illustration.name} illustration`}
            accessibilityRole="button"
          >
            <Svg width={60} height={60}>
              <G>
                {illustration.sections.map((section) => (
                  <Path
                    key={section.id}
                    d={section.path}
                    fill={section.color}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                ))}
              </G>
            </Svg>
            <Text style={styles.illustrationName}>{illustration.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Canvas */}
      <Animated.View 
        ref={canvasRef}
        style={[
          styles.canvas,
          isDark && styles.darkCanvas,
          { transform: [{ scale: zoomScale }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
          <Defs>
            {PATTERNS.map(pattern => pattern.pattern)}
          </Defs>
          <G>
            {currentIllustration.sections.map((section) => (
              <Path
                key={section.id}
                d={section.path}
                fill={selectedPattern ? `url(#${selectedPattern})` : (coloredSections[section.id] || section.color)}
                stroke="#000000"
                strokeWidth="1"
                onPress={() => handleColorSection(section.id)}
              />
            ))}
          </G>
        </Svg>
      </Animated.View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Color Palette */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.colorPalette}
        >
          {COLOR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                { backgroundColor: color.color },
                selectedColor === color.color && styles.selectedColor,
              ]}
              onPress={() => {
                setSelectedColor(color.color);
                setIsEyedropperActive(false);
                setIsMagicWandActive(false);
                setSelectedPattern(null);
                addToColorHistory(color.color);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              accessibilityLabel={`Select ${color.name} color`}
              accessibilityRole="button"
            />
          ))}
          <TouchableOpacity
            style={[styles.colorOption, styles.customColorButton]}
            onPress={() => setShowColorPicker(true)}
            accessibilityLabel="Open color picker"
            accessibilityRole="button"
          >
            <PlusCircle size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
        </ScrollView>

        {/* Color History */}
        {colorHistory.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.colorHistory}
          >
            {colorHistory.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => {
                  setSelectedColor(color);
                  setIsEyedropperActive(false);
                  setIsMagicWandActive(false);
                  setSelectedPattern(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                accessibilityLabel={`Select recently used color ${index + 1}`}
                accessibilityRole="button"
              />
            ))}
          </ScrollView>
        )}

        {/* Tools */}
        <View style={styles.tools}>
          <TouchableOpacity
            style={[styles.toolButton, isEyedropperActive && styles.activeTool]}
            onPress={() => {
              setIsEyedropperActive(!isEyedropperActive);
              setIsMagicWandActive(false);
              setSelectedPattern(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            accessibilityLabel="Toggle eyedropper tool"
            accessibilityRole="button"
          >
            <Palette size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolButton, isMagicWandActive && styles.activeTool]}
            onPress={() => {
              setIsMagicWandActive(!isMagicWandActive);
              setIsEyedropperActive(false);
              setSelectedPattern(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            accessibilityLabel="Toggle magic wand tool"
            accessibilityRole="button"
          >
            <Sparkle size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton, selectedPattern && styles.activeTool]}
            onPress={() => {
              setSelectedPattern(selectedPattern ? null : 'dots');
              setIsEyedropperActive(false);
              setIsMagicWandActive(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            accessibilityLabel="Toggle pattern fill"
            accessibilityRole="button"
          >
            <GridFour size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleUndo}
            disabled={historyIndex <= 0}
            accessibilityLabel="Undo last action"
            accessibilityRole="button"
          >
            <ArrowCounterClockwise size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleRedo}
            disabled={historyIndex >= history.length - 1}
            accessibilityLabel="Redo last action"
            accessibilityRole="button"
          >
            <ArrowClockwise size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleReset}
            accessibilityLabel="Reset illustration"
            accessibilityRole="button"
          >
            <ArrowsCounterClockwise size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleSave}
            accessibilityLabel="Save illustration"
            accessibilityRole="button"
          >
            <FloppyDisk size={24} color={isDark ? '#FFFFFF' : '#000000'} weight="regular" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          ref={confettiRef}
          duration={3000}
          colors={['#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C']}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  illustrationSelector: {
    flexDirection: 'row',
    padding: 10,
  },
  illustrationOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  selectedIllustration: {
    backgroundColor: '#FF7F50',
  },
  illustrationName: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
    fontFamily: 'SF-Pro-Text',
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkCanvas: {
    backgroundColor: '#1E1E1E',
  },
  controls: {
    padding: 20,
  },
  colorPalette: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  colorHistory: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FF7F50',
    transform: [{ scale: 1.1 }],
  },
  customColorButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTool: {
    backgroundColor: '#FF7F50',
  },
}); 