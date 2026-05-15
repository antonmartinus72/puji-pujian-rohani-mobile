import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

export default function SetlistDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'SetlistDetail'>) {
  const { setlistId } = route.params;
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { songs } = useSongs();
  const {
    getSetlist,
    renameSetlist,
    deleteSetlist,
    removeSongAt,
    moveSong,
    beginSession,
    buildShareText,
  } = useSetlist();

  const setlist = getSetlist(setlistId);
  const [name, setName] = useState(setlist?.name ?? '');

  useEffect(() => {
    if (setlist) setName(setlist.name);
  }, [setlist?.name]);

  if (!setlistId || !setlist) {
    return (
      <View
        className="flex-1 bg-slate-50 dark:bg-slate-900"
        style={{ paddingTop: insets.top }}
      >
        <Text className="mt-10 text-center text-base text-slate-500 dark:text-slate-400">
          Setlist tidak ditemukan.
        </Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="mt-3 text-center text-base font-semibold text-blue-600">
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  const activeSetlist = setlist;

  function onSaveName() {
    renameSetlist(setlistId, name);
  }

  function onDelete() {
    Alert.alert('Hapus setlist', `Hapus "${activeSetlist.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteSetlist(setlistId);
          navigation.goBack();
        },
      },
    ]);
  }

  async function onShare() {
    const message = buildShareText(setlistId);
    if (!message.trim()) return;
    try {
      await Share.share({ message, title: activeSetlist.name });
    } catch {
      /* user dismissed */
    }
  }

  function onUseSession() {
    if (!activeSetlist.songs.length) {
      Alert.alert('Setlist kosong', 'Tambahkan lagu terlebih dahulu.');
      return;
    }
    const ok = beginSession(setlistId);
    if (ok) navigation.navigate('Reader');
  }

  const rows = activeSetlist.songs.map((id) => {
    const song = songs.find((s) => Number(s.id) === Number(id));
    return { songId: id, title: song?.title ?? 'Tidak ditemukan' };
  });

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2.5 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Kembali
          </Text>
        </Pressable>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={onSaveName}
          onSubmitEditing={onSaveName}
          className="rounded-[10px] border border-slate-200 px-3 py-2.5 text-xl font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Nama setlist"
        />
        <Text className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Urutan: atas ke bawah. Gunakan panah naik/turun untuk menggeser.
        </Text>
      </View>

      <View className="flex-row gap-2.5 px-4 py-2.5">
        <Pressable
          className="min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-[10px] bg-nav py-3"
          onPress={() =>
            navigation.navigate('SongList', {
              variant: 'pick',
              setlistId,
            })
          }
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text className="text-[15px] font-bold text-white">Tambah lagu</Text>
        </Pressable>
        <Pressable
          className="min-h-[48px] flex-row items-center justify-center gap-1.5 rounded-[10px] border border-slate-300 px-4 py-3"
          onPress={() => void onShare()}
        >
          <Ionicons name="share-outline" size={20} color={colors.iconOnCard} />
          <Text className="text-[15px] font-semibold text-slate-700 dark:text-slate-300">
            Bagikan
          </Text>
        </Pressable>
      </View>

      <Pressable
        className="mx-4 mb-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-3.5"
        onPress={onUseSession}
      >
        <Text className="text-base font-bold text-emerald-800">Gunakan sekarang</Text>
        <Text className="mt-1 text-xs text-emerald-600">
          Prev / next hanya dalam setlist ini
        </Text>
      </Pressable>

      <FlatList
        data={rows}
        keyExtractor={(item, index) => `${item.songId}-${index}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <Text className="mt-6 px-6 text-center text-slate-500 dark:text-slate-400">
            Belum ada lagu. Tambah dari tombol di atas.
          </Text>
        }
        renderItem={({ item, index }) => (
          <View className="mx-4 mb-2 flex-row items-center rounded-[10px] border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
            <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
              <Text className="min-w-[36px] text-base font-bold text-slate-500">
                {item.songId}
              </Text>
              <Text
                className="min-w-0 flex-1 text-base text-slate-900 dark:text-slate-100"
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Pressable
                className="px-2.5 py-2"
                disabled={index === 0}
                onPress={() => moveSong(setlistId, index, -1)}
              >
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={index === 0 ? '#cbd5e1' : '#334155'}
                />
              </Pressable>
              <Pressable
                className="px-2.5 py-2"
                disabled={index === rows.length - 1}
                onPress={() => moveSong(setlistId, index, 1)}
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={index === rows.length - 1 ? '#cbd5e1' : '#334155'}
                />
              </Pressable>
              <Pressable
                className="px-2.5 py-2"
                onPress={() => removeSongAt(setlistId, index)}
              >
                <Ionicons name="trash-outline" size={20} color="#b91c1c" />
              </Pressable>
            </View>
          </View>
        )}
      />

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-slate-50 px-4 pt-2.5 dark:border-slate-700 dark:bg-slate-900"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Pressable className="items-center py-2.5" onPress={onDelete}>
          <Text className="text-[15px] font-semibold text-red-700">Hapus setlist</Text>
        </Pressable>
      </View>
    </View>
  );
}
