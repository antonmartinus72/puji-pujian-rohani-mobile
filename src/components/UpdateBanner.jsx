import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const [error, setError] = useState(null);

  if (!pendingUpdate) return null;

  const version = pendingUpdate.version ?? '';
  const changelog = pendingUpdate.changelog ?? '';

  async function onDownload() {
    setError(null);
    setLoading(true);
    try {
      const data = await downloadUpdate(pendingUpdate);
      applyPayload(data);
      dismissUpdateBanner();
      setUpdateMessage('Berhasil diperbarui!');
    } catch (e) {
      setError(e.message || 'Gagal mengunduh. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.textCol}>
        <Text style={styles.title}>Pembaruan daftar lagu</Text>
        <Text style={styles.sub}>Versi {version}</Text>
        {changelog ? <Text style={styles.changelog}>{changelog}</Text> : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={dismissUpdateBanner}
          style={styles.btnSecondary}
          disabled={loading}
        >
          <Text style={styles.btnSecondaryText}>Nanti</Text>
        </Pressable>
        <Pressable
          onPress={onDownload}
          style={styles.btnPrimary}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Unduh</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#fcd34d',
  },
  textCol: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  sub: {
    fontSize: 14,
    color: '#b45309',
    marginTop: 2,
  },
  changelog: {
    fontSize: 13,
    color: '#78350f',
    marginTop: 6,
  },
  err: {
    fontSize: 13,
    color: '#b91c1c',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnSecondary: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
  },
  btnSecondaryText: {
    color: '#92400e',
    fontWeight: '600',
  },
  btnPrimary: {
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#b45309',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
