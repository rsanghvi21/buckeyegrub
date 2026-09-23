import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemeProvider, ToastProvider, useTheme } from '@/src/context';

function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal/grubhub-assistant"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modal/meal-details"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modal/power-score"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modal/discount-calculator"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
