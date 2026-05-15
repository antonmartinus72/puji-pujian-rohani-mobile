import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSetlist } from '../context/SetlistContext';
import type { RootStackScreenProps } from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

export default function SetlistScreen({
  navigation,
}: RootStackScreenProps<'Setlists'>) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { setlists, hydrated, createSetlist } = useSetlist();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');

  function submitCreate() {
    const id = createSetlist(newName);
    setNewName('');
    setCreateOpen(false);
    if (id) navigation.navigate('SetlistDetail', { setlistId: id });
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900" style={{ paddingTop: insets.top }}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color={colors.iconBack} />
          <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Kembali
          </Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
          Daftar Setlist
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Setlist untuk satu sesi acara
        </Text>
      </View>

      <Pressable
        className="mx-4 my-3.5 flex-row items-center justify-center gap-2 rounded-xl bg-nav py-3.5"
        onPress={() => setCreateOpen(true)}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text className="text-base font-bold text-white">Buat baru</Text>
      </Pressable>

      {!hydrated ? (
        <Text className="mt-6 text-center text-slate-500">Memuat…</Text>
      ) : (
        <FlatList
          data={setlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={
            <Text className="mx-6 mt-8 text-center text-[15px] leading-[22px] text-slate-500 dark:text-slate-400">
              Belum ada setlist. Buat satu untuk mengurutkan lagu ibadah.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              className="mx-4 mb-2.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              onPress={() =>
                navigation.navigate('SetlistDetail', { setlistId: item.id })
              }
            >
              <Text className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">
                {item.name}
              </Text>
              <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {item.songs?.length ?? 0} lagu
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-slate-900/50 p-6"
          onPress={() => setCreateOpen(false)}
        >
          <Pressable
            className="rounded-[14px] bg-white p-5 dark:bg-slate-800"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-3 text-lg font-bold text-slate-900">Nama setlist</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Contoh: Ibadah Minggu 12 Jan"
              className="mb-4 rounded-[10px] border border-slate-200 px-3.5 py-3 text-base text-slate-900"
              autoFocus
            />
            <View className="flex-row justify-end">
              <Pressable
                className="px-3.5 py-2.5"
                onPress={() => {
                  setCreateOpen(false);
                  setNewName('');
                }}
              >
                <Text className="text-base font-semibold text-slate-500">Batal</Text>
              </Pressable>
              <Pressable
                className="rounded-[10px] bg-nav px-[18px] py-2.5"
                onPress={submitCreate}
              >
                <Text className="text-base font-bold text-white">Simpan</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
