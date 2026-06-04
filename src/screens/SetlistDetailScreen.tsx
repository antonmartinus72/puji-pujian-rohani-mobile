import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import { useSongs } from '../context/SongContext';
import { useSetlist } from '../context/SetlistContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import { formatListTitle } from '../utils/songDisplay';

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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareOption, setShareOption] = useState<'title_lyric' | 'title_only' | 'full_info'>('title_lyric');

  useEffect(() => {
    if (setlist) setName(setlist.name);
  }, [setlist?.name]);

  if (!setlistId || !setlist) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-900">
        <ScreenHeader
          title="Setlist"
          subtitle="Setlist tidak ditemukan"
          onBack={() => navigation.goBack()}
        />
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
    setShareOpen(false);
    const message = buildShareText(setlistId, shareOption);
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
    return {
      songId: id,
      title: song ? formatListTitle(song) : 'Tidak ditemukan',
    };
  });

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScreenHeader onBack={() => navigation.goBack()}>
        <TextInput
          value={name}
          onChangeText={setName}
          onEndEditing={onSaveName}
          onSubmitEditing={onSaveName}
          className="rounded-[10px] border border-slate-200 px-3 py-2.5 text-[22px] font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Nama setlist"
          placeholderTextColor="#94a3b8"
        />
      </ScreenHeader>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Text className="text-xs text-slate-400 dark:text-slate-500">
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
          className="min-h-[48px] flex-row items-center justify-center gap-1.5 rounded-[10px] border border-slate-300 px-4 py-3 dark:border-slate-600"
          onPress={() => setShareOpen(true)}
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

      <Modal visible={shareOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/45 px-6"
          onPress={() => setShareOpen(false)}
        >
          <Pressable
            className="w-full max-w-sm rounded-2xl bg-white p-5 dark:bg-slate-800"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              Opsi Bagikan Setlist
            </Text>

            <View className="mb-6 flex-col gap-3">
              <Pressable
                className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${shareOption === 'title_lyric' ? 'border-nav bg-nav/10 dark:bg-nav/10' : 'border-slate-200 dark:border-slate-600'}`}
                onPress={() => setShareOption('title_lyric')}
              >
                <View className={`h-5 w-5 rounded-full border-[1.5px] items-center justify-center ${shareOption === 'title_lyric' ? 'border-nav' : 'border-slate-300 dark:border-slate-500'}`}>
                  {shareOption === 'title_lyric' && <View className="h-2.5 w-2.5 rounded-full bg-nav" />}
                </View>
                <Text className={`text-base ${shareOption === 'title_lyric' ? 'font-semibold text-nav' : 'text-slate-700 dark:text-slate-300'}`}>Judul & Lirik (default)</Text>
              </Pressable>

              <Pressable
                className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${shareOption === 'title_only' ? 'border-nav bg-nav/10 dark:bg-nav/10' : 'border-slate-200 dark:border-slate-600'}`}
                onPress={() => setShareOption('title_only')}
              >
                <View className={`h-5 w-5 rounded-full border-[1.5px] items-center justify-center ${shareOption === 'title_only' ? 'border-nav' : 'border-slate-300 dark:border-slate-500'}`}>
                  {shareOption === 'title_only' && <View className="h-2.5 w-2.5 rounded-full bg-nav" />}
                </View>
                <Text className={`text-base ${shareOption === 'title_only' ? 'font-semibold text-nav' : 'text-slate-700 dark:text-slate-300'}`}>Judul saja</Text>
              </Pressable>

              <Pressable
                className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${shareOption === 'full_info' ? 'border-nav bg-nav/10 dark:bg-nav/10' : 'border-slate-200 dark:border-slate-600'}`}
                onPress={() => setShareOption('full_info')}
              >
                <View className={`h-5 w-5 rounded-full border-[1.5px] items-center justify-center ${shareOption === 'full_info' ? 'border-nav' : 'border-slate-300 dark:border-slate-500'}`}>
                  {shareOption === 'full_info' && <View className="h-2.5 w-2.5 rounded-full bg-nav" />}
                </View>
                <Text className={`text-base ${shareOption === 'full_info' ? 'font-semibold text-nav' : 'text-slate-700 dark:text-slate-300'}`}>Seluruh info lagu</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-200 py-3 dark:bg-slate-700"
                onPress={() => setShareOpen(false)}
              >
                <Text className="font-semibold text-slate-700 dark:text-slate-200">
                  Batal
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-nav py-3"
                onPress={onShare}
              >
                <Text className="font-bold text-white">Bagikan</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
