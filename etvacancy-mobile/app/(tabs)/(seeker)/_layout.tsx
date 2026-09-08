import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { COLORS } from '@constants/index';
import { useAuthStore, selectIsAuthenticated } from '@store/index';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingAiButton } from '@components/ui/FloatingAiButton';

function TabBarIcon({
  name,
  focused,
  color,
  size = 24,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size?: number;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function SeekerTabsLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8);

  const tabBarStyle = {
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderTopColor: isDark ? '#334155' : '#E2E8F0',
    borderTopWidth: 1,
    height: 50 + bottomInset,
    paddingTop: 6,
    paddingBottom: bottomInset,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
  };

  const tabBarLabelStyle = {
    fontSize: 11,
    fontWeight: '600' as const,
    includeFontPadding: false,
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
        tabBarStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'briefcase' : 'briefcase-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{ href: null, title: 'AI' }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Companies',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'business' : 'business-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'bookmark' : 'bookmark-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{ href: null, title: 'Applications' }}
      />
    </Tabs>
    <FloatingAiButton />
  </View>
);
}
