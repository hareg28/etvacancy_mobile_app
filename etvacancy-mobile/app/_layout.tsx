import '../src/lib/polyfill-crypto';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, selectIsAuthenticated, selectUserRole } from '@store/index';
import '../src/global.css';

// Immediately hide native splash screen on module load and component mount
SplashScreen.hideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('403')) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

function useAuthProtection() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const navigationReady = Platform.OS === 'web' ? true : (!!navigationState?.key && typeof navigationState?.index === 'number');
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const userRole = useAuthStore(selectUserRole);
  const didRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!navigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    const tabsGroup = (() => {
      const seg0 = segments[0];
      if (seg0 !== '(tabs)') return null;
      return segments[1] ?? null;
    })();

    const seekerSubPage = (() => {
      if (segments[0] === '(tabs)' && segments[1] === '(seeker)') {
        return segments[2] ?? null;
      }
      return null;
    })();

    let target: string | null = null;

    if (!isAuthenticated) {
      if (inAuthGroup) {
        // Allow unauthenticated users inside (auth) screens
      } else if (
        segments[0] === 'applications' ||
        (tabsGroup === '(seeker)' && (seekerSubPage === 'saved' || seekerSubPage === 'applications'))
      ) {
        target = '/(auth)/login';
      } else if (tabsGroup === 'admin' || tabsGroup === 'employer') {
        target = '/(auth)/login';
      }
    } else if (isAuthenticated && inAuthGroup) {
      if (userRole === 'ADMIN') {
        target = '/(tabs)/admin';
      } else if (userRole === 'EMPLOYER') {
        target = '/(tabs)/employer';
      } else {
        target = '/(tabs)/(seeker)';
      }
    } else if (isAuthenticated && tabsGroup) {
      if (tabsGroup === 'admin' && userRole !== 'ADMIN') {
        target = '/(tabs)/(seeker)';
      } else if (tabsGroup === 'employer' && userRole !== 'EMPLOYER' && userRole !== 'ADMIN') {
        target = '/(tabs)/(seeker)';
      }
    }

    const sig = `${target}|${segments.join('/')}`;
    if (!target || didRunRef.current === sig) return;
    didRunRef.current = sig;

    setTimeout(() => {
      router.replace(target as Parameters<typeof router.replace>[0]);
    }, 0);
  }, [navigationReady, isAuthenticated, segments, userRole, router]);
}

export default function RootLayout() {
  useAuthProtection();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="jobs/[id]" options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen
              name="companies/[id]"
              options={{ presentation: 'card', headerShown: false }}
            />
            <Stack.Screen
              name="applications/[id]"
              options={{ presentation: 'card', headerShown: false }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
