import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { getThemeColors } from '../constants/themeColors';
import SongReaderScreen from '../screens/SongReaderScreen';
import SongListScreen from '../screens/SongListScreen';
import SetlistScreen from '../screens/SetlistScreen';
import SetlistDetailScreen from '../screens/SetlistDetailScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigation() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.background,
        card: colors.background,
        border: colors.border,
        text: isDark ? '#f1f5f9' : '#0f172a',
        primary: colors.iconBack,
      },
    }),
    [isDark, colors]
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName="Reader"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Reader" component={SongReaderScreen} />
          <Stack.Screen name="SongList" component={SongListScreen} />
          <Stack.Screen name="Setlists" component={SetlistScreen} />
          <Stack.Screen name="SetlistDetail" component={SetlistDetailScreen} />
          <Stack.Screen name="Database" component={DatabaseScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
