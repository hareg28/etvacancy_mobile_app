import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingAiButtonProps {
  bottom?: number;
  right?: number;
  onPress?: () => void;
}

export function FloatingAiButton({
  bottom,
  right = 16,
  onPress,
}: FloatingAiButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hide the floating button if already on the AI assistant screen
  if (pathname && (pathname.includes('/assistant') || pathname.endsWith('assistant'))) {
    return null;
  }

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8);
  // Positioned directly and snugly above the Profile tab in the bottom bar
  const defaultBottom = 50 + bottomInset + 8;
  const computedBottom = bottom ?? defaultBottom;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/(seeker)/assistant' as any);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={[
        styles.fabContainer,
        { bottom: computedBottom, right },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {},
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open AI Career Assistant"
    >
      <View style={styles.fabCircle}>
        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 9999,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
});

