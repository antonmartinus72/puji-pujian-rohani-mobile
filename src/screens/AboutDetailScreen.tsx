import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import type { RootStackScreenProps } from '../navigation/types';
import appInfo from '../../package.json';

export default function AboutDetailScreen({
  navigation,
}: RootStackScreenProps<'AboutDetail'>) {
  const insets = useSafeAreaInsets();

  const appVersion = appInfo.version;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScreenHeader
        title="Tentang"
        subtitle="Aplikasi & Kontak"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100 mb-6">
          Tentang Aplikasi
        </Text>

        <Section>
          Aplikasi ini dibuat sebagai sarana pendukung ibadah, pelayanan, dan pembelajaran lagu-lagu rohani Kristen.{'\n\n'}
          Awalnya aplikasi ini dikembangkan untuk membantu kebutuhan ibadah di lingkungan gereja pengembang. Seiring waktu, aplikasi ini terus dikembangkan agar dapat digunakan oleh lebih banyak jemaat, pelayan, pemusik gereja, dan siapa pun yang membutuhkan akses mudah terhadap kumpulan lagu rohani.{'\n\n'}
          Aplikasi menyediakan database lagu bawaan dan juga mendukung penggunaan database tambahan yang dapat dibuat serta dibagikan oleh komunitas. Dengan demikian, koleksi lagu dapat terus bertambah dan disesuaikan dengan kebutuhan masing-masing pengguna.
        </Section>

        <Section title="Tujuan Aplikasi">
          • Membantu jemaat dan pelayan dalam mengakses lagu rohani.{'\n'}
          • Mendukung kegiatan ibadah, persekutuan, dan pelayanan.{'\n'}
          • Menyediakan sarana pengelolaan dan distribusi database lagu yang mudah digunakan.{'\n'}
          • Mendorong kolaborasi komunitas dalam menjaga dan melengkapi data lagu.
        </Section>

        <Section title="Hak Cipta">
          Hak cipta atas lagu, lirik, notasi, terjemahan, dan materi terkait tetap menjadi milik pencipta dan pemegang hak cipta yang sah.{'\n\n'}
          Apabila terdapat informasi yang kurang tepat, atribusi yang belum lengkap, atau materi yang seharusnya tidak ditampilkan, silakan menghubungi pengembang untuk dilakukan peninjauan.
        </Section>

        <Section title="Kontribusi dan Koreksi Data">
          Pengguna yang ingin membantu memperbaiki data lagu, melengkapi informasi pencipta, memperbaiki lirik, atau berkontribusi dalam pengembangan database dipersilakan untuk menghubungi maintainer aplikasi.
        </Section>

        <Section title="Kontak">
          <Text className="font-semibold text-slate-800 dark:text-slate-200">
            Pengembang / Maintainer{'\n'}
          </Text>
          Nama: Anton Martinus{'\n'}
          Email: antonmartinus72@gmail.com{'\n'}
          GitHub: https://github.com/antonmartinus72
        </Section>

        <Section title="Kredit Lainnya">
          Splash Screen Background by Rishi Jhajharia on Unsplash
        </Section>

        <Section title="Versi Aplikasi">
          Versi: {appVersion}
        </Section>

        <View className="mt-4 rounded-xl bg-teal-50 dark:bg-teal-900/30 p-4 border border-teal-100 dark:border-teal-800">
          <Text className="text-[15px] leading-6 text-teal-800 dark:text-teal-200 text-center">
            Terima kasih kepada seluruh pengguna, kontributor, pelayan, dan komunitas yang telah membantu pengembangan aplikasi ini.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
          {title}
        </Text>
      )}
      <Text className="text-[15px] leading-6 text-slate-600 dark:text-slate-300">
        {children}
      </Text>
    </View>
  );
}
