import { useCallback, useMemo, useState } from 'react';
import type { RootStackParamList } from '../navigation/types';

type AppNavigation = {
  navigate<Route extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[Route]
      ? [screen: Route] | [screen: Route, params: RootStackParamList[Route]]
      : [screen: Route, params: RootStackParamList[Route]]
  ): void;
};

export function useAppSidebar(navigation: AppNavigation) {
  const [visible, setVisible] = useState(false);

  const close = useCallback(() => setVisible(false), []);
  const open = useCallback(() => setVisible(true), []);

  const props = useMemo(
    () => ({
      visible,
      onClose: close,
      onOpenHome: () => {
        close();
        navigation.navigate('Reader');
      },
      onOpenSongList: () => {
        close();
        navigation.navigate('SongList', { variant: 'list' });
      },
      onOpenSetlists: () => {
        close();
        navigation.navigate('Setlists');
      },
      onOpenDatabase: () => {
        close();
        navigation.navigate('Database');
      },
      onOpenSettings: () => {
        close();
        navigation.navigate('Settings');
      },
    }),
    [visible, close, navigation]
  );

  return { visible, open, close, props };
}
