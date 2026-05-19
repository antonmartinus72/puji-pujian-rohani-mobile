import React, { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppNavbar from '../components/AppNavbar';
import Sidebar from '../components/Sidebar';
import { useAppSidebar } from '../hooks/useAppSidebar';
import { useSetlist } from '../context/SetlistContext';
import type { RootStackScreenProps } from '../navigation/types';

export default function SetlistScreen({
  navigation,
}: RootStackScreenProps<'Setlists'>) {
  const insets = useSafeAreaInsets();
  const sidebar = useAppSidebar(navigation);
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
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <AppNavbar title="Daftar Setlist" onMenu={sidebar.open} />
      <Text className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
        Setlist untuk satu sesi acara
      </Text>

      <Pressable
        className="mx-4 mb-3 flex-row items-center justify-center gap-2 rounded-xl bg-nav py-3.5"
        onPress={() => setCreateOpen(true)}
      >
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text className="text-base font-bold text-white">Buat setlist baru</Text>
      </Pressable>

      <FlatList
        data={setlists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-slate-500 dark:text-slate-400">
            {hydrated ? 'Belum ada setlist.' : 'Memuat…'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="mx-4 mb-2.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800"
            onPress={() =>
              navigation.navigate('SetlistDetail', { setlistId: item.id })
            }
          >
            <View className="min-w-0 flex-1">
              <Text
                className="text-[17px] font-semibold text-slate-900 dark:text-slate-100"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {item.songs.length} lagu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        )}
      />

      <Modal visible={createOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 items-center justify-center bg-black/45 px-6"
          onPress={() => setCreateOpen(false)}
        >
          <Pressable
            className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-800"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">
              Setlist baru
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nama setlist"
              placeholderTextColor="#94a3b8"
              className="mb-4 rounded-xl border border-slate-200 px-3.5 py-3 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              autoFocus
              onSubmitEditing={submitCreate}
            />
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-xl bg-slate-200 py-3 dark:bg-slate-700"
                onPress={() => setCreateOpen(false)}
              >
                <Text className="font-semibold text-slate-700 dark:text-slate-200">
                  Batal
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-xl bg-nav py-3"
                onPress={submitCreate}
              >
                <Text className="font-bold text-white">Buat</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Sidebar {...sidebar.props} />
    </View>
  );
}
