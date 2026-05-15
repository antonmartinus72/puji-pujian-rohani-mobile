import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';

function ToastCard({
  borderColor,
  bgClass,
  titleClass,
  subtitleClass,
  props,
}: {
  borderColor: string;
  bgClass: string;
  titleClass: string;
  subtitleClass: string;
  props: BaseToastProps;
}) {
  const { text1, text2, onPress } = props;
  const inner = (
    <View
      className={`mx-4 rounded-xl border-l-4 px-4 py-3 shadow-md ${bgClass}`}
      style={{ borderLeftColor: borderColor }}
    >
      {text1 ? (
        <Text className={`text-[15px] font-bold ${titleClass}`}>{text1}</Text>
      ) : null}
      {text2 ? (
        <Text className={`mt-0.5 text-[13px] ${subtitleClass}`}>{text2}</Text>
      ) : null}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      borderColor="#16a34a"
      bgClass="border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      titleClass="text-green-900 dark:text-green-100"
      subtitleClass="text-green-800 dark:text-green-200"
    />
  ),
  error: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      borderColor="#dc2626"
      bgClass="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      titleClass="text-red-900 dark:text-red-100"
      subtitleClass="text-red-800 dark:text-red-200"
    />
  ),
  info: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      borderColor="#2563eb"
      bgClass="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      titleClass="text-blue-900 dark:text-blue-100"
      subtitleClass="text-blue-800 dark:text-blue-200"
    />
  ),
  update: (props: BaseToastProps) => (
    <ToastCard
      props={props}
      borderColor="#d97706"
      bgClass="border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
      titleClass="text-amber-900 dark:text-amber-100"
      subtitleClass="text-amber-800 dark:text-amber-200"
    />
  ),
};
