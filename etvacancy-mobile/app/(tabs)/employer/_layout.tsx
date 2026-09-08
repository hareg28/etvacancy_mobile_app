import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { COLORS } from '@constants/index';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function EmployerTabsLayout() {
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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
        tabBarStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'grid' : 'grid-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vacancies"
        options={{
          title: 'Vacancies',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'document-text' : 'document-text-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applicants"
        options={{
          title: 'Applicants',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'people' : 'people-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="interviews"
        options={{
          title: 'Interviews',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'calendar' : 'calendar-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="company"
        options={{
          title: 'Company',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              name={focused ? 'business' : 'business-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
