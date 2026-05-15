import Toast from 'react-native-toast-message';

export function showSuccess(text1: string, text2?: string) {
  Toast.show({ type: 'success', text1, text2, position: 'top', visibilityTime: 3000 });
}

export function showError(text1: string, text2?: string) {
  Toast.show({ type: 'error', text1, text2, position: 'top', visibilityTime: 4000 });
}

export function showInfo(text1: string, text2?: string) {
  Toast.show({ type: 'info', text1, text2, position: 'top', visibilityTime: 3000 });
}

export function showUpdateAvailable(
  version: string,
  onPress: () => void,
  changelog?: string
) {
  Toast.show({
    type: 'update',
    text1: `Pembaruan database tersedia (v${version})`,
    text2: changelog ?? 'Ketuk untuk unduh',
    position: 'top',
    visibilityTime: 8000,
    onPress,
  });
}
