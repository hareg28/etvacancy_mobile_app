import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text?: string) => void;
  isLoading?: boolean;
  onPressPlus?: () => void;
  onPressMic?: () => void;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  onPressPlus,
  onPressMic,
  placeholder = 'Message',
}: ChatInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const inputRef = useRef<TextInput>(null);

  const hasText = value.trim().length > 0;

  const handleSendPress = () => {
    if (hasText && !isLoading) {
      onSend();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View
        style={[
          styles.capsuleContainer,
          isDark ? styles.capsuleDark : styles.capsuleLight,
        ]}
      >
        {/* Left Plus Action Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressPlus}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Add attachment or action"
        >
          <Ionicons
            name="add"
            size={24}
            color={isDark ? '#D1D5DB' : '#1F2937'}
          />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          multiline
          maxLength={1000}
          style={[
            styles.inputField,
            isDark ? styles.inputTextDark : styles.inputTextLight,
          ]}
          onSubmitEditing={() => {
            if (Platform.OS === 'web') {
              handleSendPress();
            }
          }}
          blurOnSubmit={false}
          returnKeyType="default"
        />

        {/* Right Voice/Mic Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressMic}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Voice input"
        >
          <Ionicons
            name="mic-outline"
            size={22}
            color={isDark ? '#D1D5DB' : '#1F2937'}
          />
        </TouchableOpacity>

        {/* Far-Right Send Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!hasText || isLoading}
          onPress={handleSendPress}
          style={[
            styles.sendCircle,
            hasText
              ? styles.sendCircleActive
              : isDark
              ? styles.sendCircleDisabledDark
              : styles.sendCircleDisabledLight,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  capsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 52,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  capsuleLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  capsuleDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    maxHeight: 110,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    includeFontPadding: false,
  },
  inputTextLight: {
    color: '#111827',
  },
  inputTextDark: {
    color: '#F9FAFB',
  },
  sendCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendCircleActive: {
    backgroundColor: '#2563EB', // Vibrant royal blue matching the screenshot
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  sendCircleDisabledLight: {
    backgroundColor: '#93C5FD',
  },
  sendCircleDisabledDark: {
    backgroundColor: '#3B82F6',
    opacity: 0.5,
  },
});
