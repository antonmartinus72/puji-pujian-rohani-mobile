import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Reader: undefined;
  SongList: {
    variant?: 'list' | 'pick';
    setlistId?: string;
    focusNumber?: boolean;
  };
  Setlists: undefined;
  SetlistDetail: { setlistId: string };
  Database: undefined;
  Settings: undefined;
  About: undefined;
  Disclaimer: undefined;
  AboutDetail: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
