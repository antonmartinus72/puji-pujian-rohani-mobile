import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfirmModal from '../components/ConfirmModal';
import DatabaseProfileAccordion from '../components/DatabaseProfileAccordion';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSongs } from '../context/SongContext';
import { useUpdateModal } from '../context/UpdateModalContext';
import type { DatabaseProfile } from '../services/databaseRegistry';
import { checkForUpdate, fetchRemoteVersion, probeGithubRepo } from '../services/updater';
import { showError, showInfo, showSuccess } from '../services/toast';
import type { RootStackScreenProps } from '../navigation/types';
import { formatRepoSummary } from '../utils/githubUrls';

export default function DatabaseScreen({
  navigation,
}: RootStackScreenProps<'Database'>) {
  const insets = useSafeAreaInsets();
  const {
    songs,
    meta,
    activeProfile,
    profiles,
    switchDatabase,
    updateDefaultRepo,
    addDatabase,
    removeDatabase,
    resetDefaultToBundled,
    refreshRegistry,
  } = useSongs();
  const { openUpdateModal } = useUpdateModal();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [newBranch, setNewBranch] = useState('main');
  const [defaultUser, setDefaultUser] = useState('');
  const [defaultRepo, setDefaultRepo] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');

  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.kind === 'default') return -1;
    if (b.kind === 'default') return 1;
    return a.name.localeCompare(b.name);
  });

  const defaultProfile = profiles.find((p) => p.kind === 'default');

  useEffect(() => {
    if (!defaultProfile) return;
    setDefaultUser(defaultProfile.github.username);
    setDefaultRepo(defaultProfile.github.repo);
    setDefaultBranch(defaultProfile.github.branch);
  }, [
    defaultProfile?.github.username,
    defaultProfile?.github.repo,
    defaultProfile?.github.branch,
  ]);

  const handleCheck = useCallback(
    async (profile: DatabaseProfile) => {
      setBusyId(profile.id);
      try {
        const result = await checkForUpdate(profile);
        if (result.hasUpdate && result.remoteVersion) {
          showInfo(
            `Pembaruan tersedia: v${result.remoteVersion.version}`,
            result.remoteVersion.changelog
          );
          openUpdateModal(profile, result.remoteVersion);
        } else {
          showSuccess('Sudah versi terbaru.');
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Gagal memeriksa pembaruan.');
      } finally {
        setBusyId(null);
      }
    },
    [openUpdateModal]
  );

  const handleDownload = useCallback(
    async (profile: DatabaseProfile) => {
      setBusyId(profile.id);
      try {
        const remote = await fetchRemoteVersion(profile);
        openUpdateModal(profile, remote);
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Gagal mengambil data dari GitHub.');
      } finally {
        setBusyId(null);
      }
    },
    [openUpdateModal]
  );

  async function saveDefaultRepo() {
    try {
      await updateDefaultRepo({
        username: defaultUser.trim(),
        repo: defaultRepo.trim(),
        branch: defaultBranch.trim() || 'main',
      });
      await refreshRegistry();
      showSuccess('Repositori default disimpan.');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  async function submitAdd() {
    const name = newName.trim();
    const username = newUser.trim();
    const repo = newRepo.trim();
    const branch = newBranch.trim() || 'main';
    if (!name || !username || !repo) {
      showError('Nama, username, dan repo wajib diisi.');
      return;
    }
    setBusyId('new');
    try {
      const github = { username, repo, branch };
      const tempProfile: DatabaseProfile = {
        id: 'probe',
        name,
        kind: 'custom',
        github,
      };
      await probeGithubRepo(tempProfile);
      await addDatabase(name, github);
      await refreshRegistry();
      setAddOpen(false);
      setNewName('');
      setNewUser('');
      setNewRepo('');
      setNewBranch('main');
      showSuccess(`Database "${name}" ditambahkan.`);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Gagal menambahkan database.');
    } finally {
      setBusyId(null);
    }
  }

  function confirmDelete(profile: DatabaseProfile) {
    setConfirm({
      title: 'Hapus database',
      message: `Hapus "${profile.name}" dan semua data cache-nya?`,
      confirmLabel: 'Hapus',
      destructive: true,
      onConfirm: () => {
        setConfirm(null);
        void (async () => {
          setBusyId(profile.id);
          try {
            await removeDatabase(profile.id);
            await refreshRegistry();
            showSuccess(`"${profile.name}" dihapus.`);
          } catch (e) {
            showError(e instanceof Error ? e.message : 'Gagal menghapus.');
          } finally {
            setBusyId(null);
          }
        })();
      },
    });
  }

  function confirmResetDefault() {
    setConfirm({
      title: 'Reset database bawaan',
      message:
        'Kembali ke data lagu yang disertakan aplikasi? Unduhan dari GitHub untuk database bawaan akan dihapus.',
      confirmLabel: 'Reset',
      destructive: true,
      onConfirm: () => {
        setConfirm(null);
        void (async () => {
          setBusyId('default');
          try {
            await resetDefaultToBundled();
            showSuccess('Database bawaan dikembalikan ke data aplikasi.');
          } catch (e) {
            showError(e instanceof Error ? e.message : 'Gagal reset.');
          } finally {
            setBusyId(null);
          }
        })();
      },
    });
  }

  return (
    <View
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      style={{ paddingTop: insets.top }}
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-3 dark:border-slate-700 dark:bg-slate-800">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text className="text-base font-semibold text-blue-600 dark:text-blue-400">
            Kembali
          </Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
          Database
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Kelola sumber data lagu dan pembaruan dari GitHub
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Ringkasan
          </Text>
          <Text className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            {activeProfile.name}
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {songs.length} lagu · v{meta.version}
            {meta.updatedAt ? ` · ${meta.updatedAt}` : ''}
          </Text>
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatRepoSummary(activeProfile.github)}
          </Text>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Kelola database
          </Text>
          <Pressable
            onPress={() => setAddOpen(true)}
            className="flex-row items-center gap-1 rounded-lg bg-nav px-3 py-2"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-sm font-bold text-white">Tambah</Text>
          </Pressable>
        </View>

        {sortedProfiles.map((profile) => (
          <DatabaseProfileAccordion
            key={profile.id}
            profile={profile}
            isActive={activeProfile.id === profile.id}
            busy={busyId === profile.id}
            songCount={
              activeProfile.id === profile.id ? songs.length : undefined
            }
            version={activeProfile.id === profile.id ? meta.version : undefined}
            updatedAt={
              activeProfile.id === profile.id ? meta.updatedAt : undefined
            }
            onCheck={() => void handleCheck(profile)}
            onDownload={() => void handleDownload(profile)}
            onActivate={() => {
              void (async () => {
                setBusyId(profile.id);
                try {
                  await switchDatabase(profile.id);
                  showSuccess('Database diaktifkan.');
                } catch (e) {
                  showError(e instanceof Error ? e.message : 'Gagal mengaktifkan.');
                } finally {
                  setBusyId(null);
                }
              })();
            }}
            onDelete={
              profile.kind === 'custom'
                ? () => confirmDelete(profile)
                : undefined
            }
            defaultRepo={
              profile.kind === 'default'
                ? {
                    username: defaultUser,
                    repo: defaultRepo,
                    branch: defaultBranch,
                    onUsernameChange: setDefaultUser,
                    onRepoChange: setDefaultRepo,
                    onBranchChange: setDefaultBranch,
                    onSaveRepo: () => void saveDefaultRepo(),
                    onResetBundled: confirmResetDefault,
                  }
                : undefined
            }
          />
        ))}
      </ScrollView>

      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <View className={isDark ? 'dark flex-1' : 'flex-1'}>
        <Pressable
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onPress={() => setAddOpen(false)}
        >
          <Pressable
            className="rounded-2xl border p-5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              Tambah database
            </Text>
            <Text className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nama
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Mis. Gereja XYZ"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              GitHub username
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={newUser}
              onChangeText={setNewUser}
              autoCapitalize="none"
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Repository
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={newRepo}
              onChangeText={setNewRepo}
              autoCapitalize="none"
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Branch
            </Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              value={newBranch}
              onChangeText={setNewBranch}
              autoCapitalize="none"
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setAddOpen(false)}
                className="flex-1 items-center rounded-lg bg-slate-200 py-2.5 dark:bg-slate-700"
              >
                <Text className="font-bold text-slate-800 dark:text-slate-200">
                  Batal
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void submitAdd()}
                disabled={busyId === 'new'}
                className="flex-1 items-center rounded-lg bg-nav py-2.5"
              >
                <Text className="font-bold text-white">Simpan</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirm != null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
}
