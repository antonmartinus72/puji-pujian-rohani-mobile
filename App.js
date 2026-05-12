import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SongProvider } from './src/context/SongContext';
import { SetlistProvider } from './src/context/SetlistContext';
import SongReaderScreen from './src/screens/SongReaderScreen';
import SearchScreen from './src/screens/SearchScreen';
import SongListScreen from './src/screens/SongListScreen';
import SetlistScreen from './src/screens/SetlistScreen';
import SetlistDetailScreen from './src/screens/SetlistDetailScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <SongProvider>
        <SetlistProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Reader"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Reader" component={SongReaderScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="SongList" component={SongListScreen} />
              <Stack.Screen name="Setlists" component={SetlistScreen} />
              <Stack.Screen name="SetlistDetail" component={SetlistDetailScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SetlistProvider>
      </SongProvider>
    </SafeAreaProvider>
  );
}
