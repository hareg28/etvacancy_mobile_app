import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack initialRouteName="(seeker)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(seeker)" options={{ headerShown: false }} />
      <Stack.Screen name="employer" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
    </Stack>
  );
}
