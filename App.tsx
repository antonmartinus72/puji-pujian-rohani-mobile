import './global.css';
import './src/lib/nativewindSetup';
import React from 'react';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SongProvider } from './src/context/SongContext';
import { SetlistProvider } from './src/context/SetlistContext';
import { UpdateModalProvider } from './src/context/UpdateModalContext';
import { toastConfig } from './src/components/ToastConfig';
import DatabaseUpdateModal from './src/components/DatabaseUpdateModal';
import StartupUpdateListener from './src/components/StartupUpdateListener';
import AppNavigation from './src/navigation/AppNavigation';
import { getThemeColors } from './src/constants/themeColors';

function AppRoot() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <SongProvider>
          <UpdateModalProvider>
            <SetlistProvider>
              <AppNavigation />
              <StartupUpdateListener />
              <DatabaseUpdateModal />
              <Toast config={toastConfig} />
            </SetlistProvider>
          </UpdateModalProvider>
        </SongProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}
