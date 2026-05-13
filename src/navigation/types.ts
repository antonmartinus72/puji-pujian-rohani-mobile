import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Reader: undefined;
  SongList: {
    variant?: 'browse' | 'search' | 'number' | 'pick';
    setlistId?: string;
  };
  Setlists: undefined;
  SetlistDetail: { setlistId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
