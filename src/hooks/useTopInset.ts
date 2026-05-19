import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Reliable top inset on Android edge-to-edge when insets.top is 0. */
export function useTopInset(): number {
  const insets = useSafeAreaInsets();
  if (insets.top > 0) return insets.top;
  if (Platform.OS === 'android') {
    return RNStatusBar.currentHeight ?? 28;
  }
  return 0;
}
