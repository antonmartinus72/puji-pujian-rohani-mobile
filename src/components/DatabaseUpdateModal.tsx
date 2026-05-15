import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUpdateModal } from '../context/UpdateModalContext';
import { useSongs } from '../context/SongContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { downloadUpdate } from '../services/updater';
import { showError, showSuccess } from '../services/toast';
import { formatRepoSummary } from '../utils/githubUrls';

export default function DatabaseUpdateModal() {
  const { target, loading, closeUpdateModal, setLoading } = useUpdateModal();
  const { activeProfile, applyPayload, checkActiveUpdate, dismissUpdateBanner } =
    useSongs();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  if (!target) return null;

  const { profile, remoteVersion } = target;
  const version = remoteVersion.version ?? '';
  const changelog = remoteVersion.changelog ?? '';

  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const subtitleColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const bodyColor = isDark ? '#cbd5e1' : '#334155';

  async function onConfirm() {
    setLoading(true);
    try {
      const data = await downloadUpdate(profile, remoteVersion);
      if (activeProfile.id === profile.id) {
        applyPayload(data);
      }
      dismissUpdateBanner();
      closeUpdateModal();
      showSuccess(`Berhasil mengunduh v${version}`);
      if (activeProfile.id === profile.id) {
        void checkActiveUpdate();
      }
    } catch (e) {
      showError(
        e instanceof Error ? e.message : 'Gagal mengunduh. Coba lagi nanti.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={closeUpdateModal}
    >
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
        <Pressable
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={closeUpdateModal}
        >
          <Pressable
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold" style={{ color: titleColor }}>
              Pembaruan database
            </Text>
            <Text className="mt-2 text-base font-semibold" style={{ color: subtitleColor }}>
              {profile.name}
            </Text>
            <Text className="mt-1 text-sm" style={{ color: mutedColor }}>
              {formatRepoSummary(profile.github)}
            </Text>
            <Text className="mt-3 text-sm" style={{ color: bodyColor }}>
              Versi baru: <Text className="font-bold">v{version}</Text>
            </Text>
            {changelog ? (
              <Text className="mt-2 text-sm" style={{ color: mutedColor }}>
                {changelog}
              </Text>
            ) : null}
            <View className="mt-5 flex-row justify-end gap-2.5">
              <Pressable
                onPress={closeUpdateModal}
                disabled={loading}
                className="rounded-lg px-4 py-2.5"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="font-semibold" style={{ color: subtitleColor }}>
                  Batal
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void onConfirm()}
                disabled={loading}
                className="min-w-[120px] items-center justify-center rounded-lg bg-nav px-4 py-2.5"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Unduh sekarang</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
