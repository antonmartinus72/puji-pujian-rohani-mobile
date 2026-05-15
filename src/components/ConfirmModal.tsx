import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  if (!visible) return null;

  const titleColor = isDark ? '#f1f5f9' : '#0f172a';
  const messageColor = isDark ? '#cbd5e1' : '#475569';
  const cancelTextColor = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
        <Pressable
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onCancel}
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
              {title}
            </Text>
            <Text className="mt-2 text-[15px] leading-[22px]" style={{ color: messageColor }}>
              {message}
            </Text>
            <View className="mt-5 flex-row justify-end gap-2.5">
              <Pressable
                onPress={onCancel}
                className="rounded-lg px-4 py-2.5"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="font-semibold" style={{ color: cancelTextColor }}>
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                className="rounded-lg px-4 py-2.5"
                style={{
                  backgroundColor: destructive ? '#dc2626' : '#1e3a5f',
                }}
              >
                <Text className="font-bold text-white">{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
