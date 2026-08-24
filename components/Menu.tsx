import React, { useEffect, useRef, useState } from 'react';
import { 
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { SafeText } from '@/components/ThemedText';
import { radius, shadows, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  state?: 'default' | 'destructive';
}

interface MenuProps {
  visible: boolean;
  onDismiss: () => void;
  items: MenuItem[];
  trigger: React.ReactNode;
}

export function Menu({ visible, onDismiss, items, trigger }: MenuProps) {
  const { colors } = useTheme();
  const triggerRef = useRef<View>(null);
  const [position, setPosition] = useState<{ top: number; right: number; maxHeight: number } | null>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get('window').width;
        const windowHeight = Dimensions.get('window').height;
        setPosition({
          top: Math.min(y + height + spacing.micro, windowHeight - 56),
          right: Math.max(spacing.micro, windowWidth - (x + width)),
          maxHeight: Math.max(56, windowHeight - (y + height + spacing.field)),
        });
      });
    }
  }, [visible]);

  return (
    <View ref={triggerRef} collapsable={false}>
      {trigger}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onDismiss}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Dismiss menu"
            accessibilityRole="button"
            onPress={onDismiss}
            style={StyleSheet.absoluteFill}
          />
            {position && (
              <View
                accessibilityRole="menu"
                style={[
                  styles.menu,
                  shadows.overlay,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    maxHeight: position.maxHeight,
                    top: position.top,
                    right: position.right,
                  },
                ]}
              >
                {items.map((item, index) => (
                  <Pressable
                    accessibilityHint={`Runs ${item.label}`}
                    accessibilityLabel={item.label}
                    accessibilityRole="menuitem"
                    style={[
                      styles.menuItem,
                      index < items.length - 1 ? { borderBottomColor: colors.divider, borderBottomWidth: 1 } : undefined,
                    ]}
                    onPress={() => {
                      onDismiss();
                      requestAnimationFrame(item.onPress);
                    }}
                  >
                    {item.icon ? item.icon : null}
                    <SafeText
                      style={styles.menuText}
                      variant="body"
                      color={item.state === 'destructive' ? colors.danger : colors.text}
                    >
                      {item.label}
                    </SafeText>
                  </Pressable>
                ))}
              </View>
            )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    borderCurve: 'continuous',
    borderRadius: radius.control,
    borderWidth: 1,
    minWidth: 200,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.macro,
    minHeight: 48,
    paddingHorizontal: spacing.control,
    paddingVertical: spacing.micro,
  },
  menuText: {
    flexShrink: 1,
  },
});