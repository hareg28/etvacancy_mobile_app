import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ViewStyle } from 'react-native';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  padding?: boolean;
  backgroundColor?: string;
  className?: string;
  contentClassName?: string;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
  withTabBar?: boolean;
  /** Maximum width for content container on large screens (defaults to 1280px / 7xl) */
  maxWidth?: number;
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  padding,
  backgroundColor,
  className = '',
  contentClassName = '',
  keyboardAvoiding = true,
  style,
  withTabBar = true,
  maxWidth = 1280,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const isPadded = padding ?? padded;

  const Container = keyboardAvoiding ? KeyboardAvoidingView : View;
  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const TAB_BAR_HEIGHT = 50;
  const bottomPad = withTabBar
    ? TAB_BAR_HEIGHT + Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8)
    : 0;

  const innerContent = (
    <View
      style={[
        styles.responsiveWrapper,
        { maxWidth },
        isPadded ? styles.paddedContainer : null,
      ]}
    >
      {children}
    </View>
  );

  const content = scrollable ? (
    <ScrollView
      className={`flex-1 ${contentClassName}`}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: bottomPad,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {innerContent}
    </ScrollView>
  ) : (
    <View
      className={`flex-1 ${contentClassName}`}
      style={[
        styles.nonScrollContainer,
        bottomPad ? { paddingBottom: bottomPad } : null,
      ]}
    >
      {innerContent}
    </View>
  );

  return (
    <SafeAreaView
      className={`flex-1 bg-gray-50 dark:bg-neutral-900 ${className}`}
      style={[{ backgroundColor }, style]}
      edges={['top', 'left', 'right']}
    >
      <Container
        style={{ flex: 1 }}
        behavior={behavior}
        keyboardVerticalOffset={0}
      >
        {content}
      </Container>
    </SafeAreaView>
  );
}

interface AuthScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthScreenContainer({
  children,
  className = '',
}: AuthScreenContainerProps) {
  return (
    <Screen
      scrollable
      padded={false}
      className={`bg-slate-50 dark:bg-slate-950 ${className}`}
      withTabBar={false}
    >
      <View style={styles.authContainer}>
        {children}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  responsiveWrapper: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  paddedContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingVertical: 16,
  },
  nonScrollContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
