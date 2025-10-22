import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface DialogProps {
  visible: boolean;
  onClose: () => void;  
  title: string;
  message: string;
  icon?: {
    name: string;
    color?: string;
    backgroundColor?: string;
  };
  actions?: {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onPress: (text?: string) => void;
  }[];
  closeOnBackdropPress?: boolean;
  showTextInput?: boolean;
  textInputPlaceholder?: string;
  textInputValue?: string;
  onTextChange?: (text: string) => void;
}

export default function Dialog({
  visible,
  onClose,
  title,
  message,
  icon,
  actions = [],
  closeOnBackdropPress = true,
  showTextInput = false,
  textInputPlaceholder = 'Enter text...',
  textInputValue = '',
  onTextChange,
}: DialogProps) {
  const insets = useSafeAreaInsets();
  const [scaleAnim] = React.useState(new Animated.Value(0.8));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getActionStyle = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
        return styles.primaryAction;
      case 'danger':
        return styles.dangerAction;
      default:
        return styles.secondaryAction;
    }
  };

  const getActionTextStyle = (variant: string = 'secondary') => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return styles.primaryActionText;
      default:
        return styles.secondaryActionText;
    }
  };

  const renderActions = () => {
    if (actions.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.action, styles.primaryAction]}
          onPress={onClose}
        >
          <Text style={styles.primaryActionText}>OK</Text>
        </TouchableOpacity>
      );
    }

    if (actions.length === 1) {
      const action = actions[0];
      return (
        <TouchableOpacity
          style={[styles.action, getActionStyle(action.variant)]}
          onPress={() => action.onPress(textInputValue)}
        >
          <Text style={getActionTextStyle(action.variant)}>{action.label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.actionRow}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.label}
            style={[
              styles.action,
              getActionStyle(action.variant),
              { flex: action.variant === 'primary' ? 2 : 1 },
              index > 0 && { marginLeft: 12 },
            ]}
            onPress={() => action.onPress(textInputValue)}
          >
            <Text style={getActionTextStyle(action.variant)}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdropPress ? onClose : undefined}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.dialog,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {icon && (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: icon.backgroundColor || Colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name={icon.name as any}
                size={32}
                color={icon.color || Colors.white}
              />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {showTextInput && (
            <TextInput
              style={styles.textInput}
              placeholder={textInputPlaceholder}
              placeholderTextColor={Colors.text.secondary}
              value={textInputValue}
              onChangeText={onTextChange}
              autoFocus
              returnKeyType="done"
            />
          )}

          <View style={styles.actionsContainer}>{renderActions()}</View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dialog: {
    width: width - 48,
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  secondaryAction: {
    backgroundColor: Colors.surface,
  },
  dangerAction: {
    backgroundColor: Colors.error,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  textInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
});