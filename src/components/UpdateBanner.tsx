import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { downloadUpdate } from '../services/updater';
import { useSongs } from '../context/SongContext';

export default function UpdateBanner() {
  const {
    pendingUpdate,
    dismissUpdateBanner,
    applyPayload,
    setUpdateMessage,
  } = useSongs();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pendingUpdate) return null;

  const version = pendingUpdate.version ?? '';
  const changelog = pendingUpdate.changelog ?? '';

  async function onDownload() {
    if (!pendingUpdate) return;
    setError(null);
    setLoading(true);
    try {
      const data = await downloadUpdate(pendingUpdate);
      applyPayload(data);
      dismissUpdateBanner();
      setUpdateMessage('Berhasil diperbarui!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengunduh. Coba lagi nanti.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="border-b border-amber-300 bg-amber-100 px-3.5 py-3">
      <View className="mb-2.5">
        <Text className="text-base font-bold text-amber-900">Pembaruan daftar lagu</Text>
        <Text className="mt-0.5 text-sm text-amber-700">Versi {version}</Text>
        {changelog ? (
          <Text className="mt-1.5 text-[13px] text-amber-950">{changelog}</Text>
        ) : null}
        {error ? (
          <Text className="mt-1.5 text-[13px] text-red-700">{error}</Text>
        ) : null}
      </View>
      <View className="flex-row justify-end gap-2.5">
        <Pressable
          onPress={dismissUpdateBanner}
          className="rounded-lg bg-amber-50 px-3.5 py-2"
          disabled={loading}
        >
          <Text className="font-semibold text-amber-900">Nanti</Text>
        </Pressable>
        <Pressable
          onPress={() => void onDownload()}
          className="min-w-[100px] items-center justify-center rounded-lg bg-amber-700 px-4 py-2"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="font-bold text-white">Unduh</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
