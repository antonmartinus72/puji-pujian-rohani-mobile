import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSongs } from '../context/SongContext';
import type { DatabaseProfile } from '../services/databaseRegistry';
import {
  checkForUpdate,
  downloadUpdate,
  fetchRemoteVersion,
  probeGithubRepo,
} from '../services/updater';
import { formatRepoSummary } from '../utils/githubUrls';
import type { RootStackScreenProps } from '../navigation/types';

function ActionButton({
  label,
  onPress,
  loading,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const bg =
    variant === 'danger'
      ? 'bg-red-600'
      : variant === 'secondary'
        ? 'bg-slate-200'
        : 'bg-nav';
  const text =
    variant === 'secondary' ? 'text-slate-800' : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`min-h-[40px] flex-1 items-center justify-center rounded-lg px-3 py-2.5 ${bg}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#334155' : '#fff'} />
      ) : (
        <Text className={`text-center text-sm font-bold ${text}`}>{label}</Text>
      )}
    </Pressable>
  );
}

function ProfileCard({
  profile,
  isActive,
  onSelect,
  onCheck,
  onDownload,
  onDelete,
  busy,
}: {
  profile: DatabaseProfile;
  isActive: boolean;
  onSelect: () => void;
  onCheck: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  busy: boolean;
}) {
  return (
    <View
      className={`mb-3 rounded-xl border p-4 ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
      }`}
    >
      <Pressable onPress={onSelect} className="mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name={isActive ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={isActive ? '#2563eb' : '#94a3b8'}
          />
          <Text className="flex-1 text-[17px] font-semibold text-slate-900">
            {profile.name}
          </Text>
          {isActive ? (
            <View className="rounded-md bg-blue-600 px-2 py-0.5">
              <Text className="text-xs font-bold text-white">Aktif</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 text-sm text-slate-500">
          {formatRepoSummary(profile.github)}
        </Text>
      </Pressable>
      <View className="flex-row gap-2">
        <ActionButton
          label="Periksa"
          variant="secondary"
          loading={busy}
          onPress={onCheck}
        />
        <ActionButton label="Unduh" loading={busy} onPress={onDownload} />
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            disabled={busy}
            className="items-center justify-center rounded-lg bg-red-50 px-3 py-2.5"
          >
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

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
    applyPayload,
    checkActiveUpdate,
  } = useSongs();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [newBranch, setNewBranch] = useState('main');
  const [defaultUser, setDefaultUser] = useState(activeProfile.github.username);
  const [defaultRepo, setDefaultRepo] = useState(activeProfile.github.repo);
  const [defaultBranch, setDefaultBranch] = useState(activeProfile.github.branch);

  const defaultProfile = profiles.find((p) => p.kind === 'default');
  const customProfiles = profiles.filter((p) => p.kind === 'custom');

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

  const runForProfile = useCallback(
    async (profile: DatabaseProfile, action: 'check' | 'download') => {
      setBusyId(profile.id);
      setError(null);
      setMessage(null);
      try {
        if (action === 'check') {
          const result = await checkForUpdate(profile);
          if (result.hasUpdate) {
            setMessage(
              `Pembaruan tersedia: v${result.remoteVersion.version}${
                result.remoteVersion.changelog
                  ? ` — ${result.remoteVersion.changelog}`
                  : ''
              }`
            );
          } else {
            setMessage('Sudah versi terbaru.');
          }
        } else {
          const remote = await fetchRemoteVersion(profile);
          const data = await downloadUpdate(profile, remote);
          if (activeProfile.id === profile.id) {
            applyPayload(data);
          }
          setMessage(`Berhasil mengunduh v${remote.version}.`);
          if (activeProfile.id === profile.id) {
            void checkActiveUpdate();
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Operasi gagal.');
      } finally {
        setBusyId(null);
      }
    },
    [activeProfile.id, applyPayload, checkActiveUpdate]
  );

  async function saveDefaultRepo() {
    setError(null);
    setMessage(null);
    try {
      await updateDefaultRepo({
        username: defaultUser.trim(),
        repo: defaultRepo.trim(),
        branch: defaultBranch.trim() || 'main',
      });
      await refreshRegistry();
      setMessage('Repositori default disimpan.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    }
  }

  async function submitAdd() {
    const name = newName.trim();
    const username = newUser.trim();
    const repo = newRepo.trim();
    const branch = newBranch.trim() || 'main';
    if (!name || !username || !repo) {
      setError('Nama, username, dan repo wajib diisi.');
      return;
    }
    setBusyId('new');
    setError(null);
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
      setMessage(`Database "${name}" ditambahkan.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambahkan database.');
    } finally {
      setBusyId(null);
    }
  }

  function confirmDelete(profile: DatabaseProfile) {
    Alert.alert(
      'Hapus database',
      `Hapus "${profile.name}" dan semua data cache-nya?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(profile.id);
              try {
                await removeDatabase(profile.id);
                await refreshRegistry();
                setMessage(`"${profile.name}" dihapus.`);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Gagal menghapus.');
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ]
    );
  }

  function confirmResetDefault() {
    Alert.alert(
      'Reset database bawaan',
      'Kembali ke data lagu yang disertakan aplikasi? Unduhan dari GitHub untuk database bawaan akan dihapus.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId('default');
              try {
                await resetDefaultToBundled();
                setMessage('Database bawaan dikembalikan ke data aplikasi.');
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Gagal reset.');
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-slate-200 bg-white px-4 pb-3">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="mb-2 flex-row items-center gap-0.5"
        >
          <Ionicons name="chevron-back" size={22} color="#2563eb" />
          <Text className="text-base font-semibold text-blue-600">Kembali</Text>
        </Pressable>
        <Text className="text-[22px] font-bold text-slate-900">Database</Text>
        <Text className="mt-1 text-sm text-slate-500">
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
        <View className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Ringkasan
          </Text>
          <Text className="mt-2 text-lg font-bold text-slate-900">
            {activeProfile.name}
          </Text>
          <Text className="mt-1 text-sm text-slate-600">
            {songs.length} lagu · v{meta.version}
            {meta.updatedAt ? ` · ${meta.updatedAt}` : ''}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {formatRepoSummary(activeProfile.github)}
          </Text>
        </View>

        {message ? (
          <View className="mb-4 rounded-lg bg-emerald-50 px-3 py-2.5">
            <Text className="text-sm text-emerald-800">{message}</Text>
          </View>
        ) : null}
        {error ? (
          <View className="mb-4 rounded-lg bg-red-50 px-3 py-2.5">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        <Text className="mb-3 text-lg font-bold text-slate-900">Pengaturan</Text>

        {defaultProfile ? (
          <View className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-base font-bold text-slate-900">
              Database bawaan
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Data aplikasi atau unduhan dari repositori resmi
            </Text>

            <Text className="mb-1 mt-4 text-xs font-semibold text-slate-600">
              GitHub username
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900"
              value={defaultUser}
              onChangeText={setDefaultUser}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="mb-1 mt-3 text-xs font-semibold text-slate-600">
              Repository
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900"
              value={defaultRepo}
              onChangeText={setDefaultRepo}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="mb-1 mt-3 text-xs font-semibold text-slate-600">
              Branch
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900"
              value={defaultBranch}
              onChangeText={setDefaultBranch}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              onPress={() => void saveDefaultRepo()}
              className="mt-3 items-center rounded-lg bg-slate-800 py-2.5"
            >
              <Text className="font-bold text-white">Simpan repositori</Text>
            </Pressable>

            <View className="mt-4 flex-row gap-2">
              <ActionButton
                label="Periksa pembaruan"
                variant="secondary"
                loading={busyId === defaultProfile.id}
                onPress={() => void runForProfile(defaultProfile, 'check')}
              />
              <ActionButton
                label="Unduh pembaruan"
                loading={busyId === defaultProfile.id}
                onPress={() => void runForProfile(defaultProfile, 'download')}
              />
            </View>

            <Pressable
              onPress={confirmResetDefault}
              className="mt-3 items-center rounded-lg border border-red-200 bg-red-50 py-2.5"
              disabled={busyId === 'default'}
            >
              <Text className="font-semibold text-red-700">
                Reset ke data bawaan aplikasi
              </Text>
            </Pressable>

            {activeProfile.id !== defaultProfile.id ? (
              <Pressable
                onPress={() => void switchDatabase(defaultProfile.id)}
                className="mt-3 items-center rounded-lg border border-blue-200 bg-blue-50 py-2.5"
              >
                <Text className="font-semibold text-blue-700">
                  Gunakan database bawaan
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-900">Database lain</Text>
          <Pressable
            onPress={() => {
              setAddOpen(true);
              setError(null);
            }}
            className="flex-row items-center gap-1 rounded-lg bg-nav px-3 py-2"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-sm font-bold text-white">Tambah</Text>
          </Pressable>
        </View>

        {customProfiles.length === 0 ? (
          <Text className="mb-4 text-sm text-slate-500">
            Belum ada database tambahan. Tambahkan repositori GitHub publik dengan
            songs.json dan version.json.
          </Text>
        ) : (
          customProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={activeProfile.id === profile.id}
              onSelect={() => void switchDatabase(profile.id)}
              onCheck={() => void runForProfile(profile, 'check')}
              onDownload={() => void runForProfile(profile, 'download')}
              onDelete={() => confirmDelete(profile)}
              busy={busyId === profile.id}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/45 px-5"
          onPress={() => setAddOpen(false)}
        >
          <Pressable
            className="rounded-2xl bg-white p-5"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-4 text-lg font-bold text-slate-900">
              Tambah database
            </Text>
            <Text className="mb-1 text-xs font-semibold text-slate-600">Nama</Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5"
              placeholder="Mis. Gereja XYZ"
              value={newName}
              onChangeText={setNewName}
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600">
              GitHub username
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5"
              value={newUser}
              onChangeText={setNewUser}
              autoCapitalize="none"
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600">
              Repository
            </Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2.5"
              value={newRepo}
              onChangeText={setNewRepo}
              autoCapitalize="none"
            />
            <Text className="mb-1 text-xs font-semibold text-slate-600">Branch</Text>
            <TextInput
              className="mb-4 rounded-lg border border-slate-200 px-3 py-2.5"
              value={newBranch}
              onChangeText={setNewBranch}
              autoCapitalize="none"
            />
            <View className="flex-row gap-2">
              <ActionButton
                label="Batal"
                variant="secondary"
                onPress={() => setAddOpen(false)}
              />
              <ActionButton
                label="Simpan"
                loading={busyId === 'new'}
                onPress={() => void submitAdd()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
