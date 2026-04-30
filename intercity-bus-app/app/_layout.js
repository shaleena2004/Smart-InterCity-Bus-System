import React from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DarkTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="role" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="bus-details" />
          <Stack.Screen name="sos" options={{ presentation: 'modal' }} />
          <Stack.Screen name="maintenance" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="emergency-contacts" />
          <Stack.Screen name="admin" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
