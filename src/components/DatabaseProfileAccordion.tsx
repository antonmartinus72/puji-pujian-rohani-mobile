import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DatabaseProfile } from '../services/databaseRegistry';
import { formatRepoSummary } from '../utils/githubUrls';
import { useThemeColors } from '../hooks/useThemeColors';

function ActionButton({
  label,
  onPress,
  loading,
  variant = 'primary',
  className = '',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}) {
  const bg =
    variant === 'danger'
      ? 'bg-red-600'
      : variant === 'secondary'
        ? 'bg-slate-200 dark:bg-slate-700'
        : 'bg-nav';
  const text =
    variant === 'secondary'
      ? 'text-slate-800 dark:text-slate-200'
      : 'text-white';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`min-h-[40px] items-center justify-center rounded-lg px-3 py-2.5 ${bg} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#94a3b8' : '#fff'} />
      ) : (
        <Text className={`text-center text-sm font-bold ${text}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export interface DefaultRepoFields {
  username: string;
  repo: string;
  branch: string;
  onUsernameChange: (v: string) => void;
  onRepoChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onSaveRepo: () => void;
  onResetBundled: () => void;
}

export interface DatabaseProfileAccordionProps {
  profile: DatabaseProfile;
  isActive: boolean;
  busy: boolean;
  songCount?: number;
  version?: string;
  updatedAt?: string;
  defaultRepo?: DefaultRepoFields;
  onCheck: () => void;
  onDownload: () => void;
  onActivate: () => void;
  onDelete?: () => void;
}

export default function DatabaseProfileAccordion({
  profile,
  isActive,
  busy,
  songCount,
  version,
  updatedAt,
  defaultRepo,
  onCheck,
  onDownload,
  onActivate,
  onDelete,
}: DatabaseProfileAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = useThemeColors();

  const cardClass = isActive
    ? 'mb-3 rounded-xl border-2 border-emerald-500 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950'
    : 'mb-3 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800';

  return (
    <View className={cardClass}>
      <View className="p-4">
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="flex-row items-start"
        >
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">
                {profile.name}
              </Text>
              {isActive ? (
                <View className="rounded-md bg-emerald-600 px-2 py-0.5">
                  <Text className="text-xs font-bold text-white">Aktif</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {formatRepoSummary(profile.github)}
            </Text>
            {isActive && songCount != null ? (
              <Text className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                {songCount} lagu
                {version ? ` · v${version}` : ''}
                {updatedAt ? ` · ${updatedAt}` : ''}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.iconMuted}
          />
        </Pressable>

        <View className="mt-3">
          <ActionButton
            label="Periksa"
            variant="secondary"
            loading={busy}
            onPress={onCheck}
            className="w-full"
          />
        </View>
      </View>

      {expanded ? (
        <View className="border-t border-slate-200 px-4 pb-4 pt-3 dark:border-slate-600">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Info database
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300">
            Branch: {profile.github.branch}
          </Text>
          {version ? (
            <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Versi cache: v{version}
              {updatedAt ? ` · ${updatedAt}` : ''}
            </Text>
          ) : null}
          {songCount != null && !isActive ? (
            <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {songCount} lagu (saat diaktifkan)
            </Text>
          ) : null}

          {profile.kind === 'default' && defaultRepo ? (
            <View className="mt-4">
              <Text className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                GitHub username
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                value={defaultRepo.username}
                onChangeText={defaultRepo.onUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="mb-1 mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Repository
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                value={defaultRepo.repo}
                onChangeText={defaultRepo.onRepoChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text className="mb-1 mt-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Branch
              </Text>
              <TextInput
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                value={defaultRepo.branch}
                onChangeText={defaultRepo.onBranchChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={defaultRepo.onSaveRepo}
                className="mt-3 items-center rounded-lg bg-slate-800 py-2.5 dark:bg-slate-600"
              >
                <Text className="font-bold text-white">Simpan repositori</Text>
              </Pressable>
              <Pressable
                onPress={defaultRepo.onResetBundled}
                className="mt-2 items-center rounded-lg border border-red-200 bg-red-50 py-2.5 dark:border-red-800 dark:bg-red-950"
              >
                <Text className="font-semibold text-red-700 dark:text-red-300">
                  Reset ke data bawaan aplikasi
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="mt-4 gap-2">
            {!isActive ? (
              <ActionButton
                label="Aktifkan"
                loading={busy}
                onPress={onActivate}
                className="w-full"
              />
            ) : null}
            <ActionButton
              label="Unduh"
              loading={busy}
              onPress={onDownload}
              className="w-full"
            />
            {profile.kind === 'custom' && onDelete ? (
              <ActionButton
                label="Hapus database"
                variant="danger"
                loading={busy}
                onPress={onDelete}
                className="w-full"
              />
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}
