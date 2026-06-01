import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import type { RootStackScreenProps } from '../navigation/types';

export default function DisclaimerScreen({
  navigation,
}: RootStackScreenProps<'Disclaimer'>) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-900">
      <ScreenHeader
        title="Disclaimer"
        subtitle="Syarat Penggunaan"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100 mb-2">
          DISCLAIMER DAN SYARAT PENGGUNAAN
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Versi 1.0{'\n'}Berlaku sejak: 1 Juni 2026
        </Text>

        <Section title="1. Tentang Aplikasi">
          Aplikasi ini dikembangkan sebagai sarana pendukung ibadah, pelayanan, pembelajaran, dan penggunaan pribadi bagi umat Kristen.{'\n\n'}
          Aplikasi ini awalnya dibuat untuk membantu kebutuhan ibadah dan pelayanan di lingkungan gereja pengembang, kemudian dikembangkan agar dapat digunakan oleh pengguna lain yang membutuhkan akses terhadap kumpulan lagu rohani dan materi pendukung ibadah.{'\n\n'}
          Aplikasi ini disediakan secara gratis dan tidak bertujuan untuk memperoleh keuntungan komersial dari lagu-lagu atau materi yang terdapat di dalamnya.
        </Section>

        <Section title="2. Hak Cipta dan Kepemilikan Karya">
          Seluruh hak cipta atas lirik lagu, notasi, terjemahan, aransemen, rekaman, maupun materi terkait tetap menjadi milik pencipta, penerbit, organisasi, gereja, atau pemegang hak cipta yang sah.{'\n\n'}
          Pengembang aplikasi tidak mengklaim kepemilikan atas karya-karya tersebut kecuali dinyatakan secara khusus.{'\n\n'}
          Pencantuman suatu lagu dalam aplikasi ini tidak dimaksudkan sebagai pengalihan, pengambilalihan, atau klaim kepemilikan atas hak cipta lagu tersebut.
        </Section>

        <Section title="3. Sumber Lagu dan Materi">
          Lagu-lagu yang tersedia dalam aplikasi dikumpulkan dari berbagai sumber, termasuk namun tidak terbatas pada:{'\n'}
          • Buku lagu gereja{'\n'}
          • Dokumen pelayanan{'\n'}
          • Publikasi rohani{'\n'}
          • Sumber daring{'\n'}
          • Kontribusi komunitas{'\n'}
          • Database yang dibuat pengguna{'\n\n'}
          Sebagian lagu memiliki informasi pencipta, sumber, atau pemegang hak cipta yang lengkap. Namun terdapat pula lagu-lagu yang sumber asli atau informasi kepemilikannya belum dapat diidentifikasi secara pasti.{'\n\n'}
          Pengembang tidak bermaksud menghilangkan atribusi maupun mengabaikan hak pemilik karya. Apabila terdapat informasi yang kurang tepat, pengguna dipersilakan untuk menghubungi pengembang guna membantu perbaikan data.
        </Section>

        <Section title="4. Database Bawaan dan Database Komunitas">
          Aplikasi ini menyediakan database bawaan yang disertakan bersama aplikasi.{'\n\n'}
          Selain database bawaan, aplikasi juga mendukung penggunaan database tambahan yang dapat dibuat, dibagikan, dan dikelola oleh komunitas atau pihak ketiga melalui sumber eksternal.{'\n\n'}
          Konten yang berasal dari database komunitas atau pihak ketiga merupakan tanggung jawab pembuat database masing-masing.{'\n\n'}
          Pengembang aplikasi tidak menjamin keakuratan, kelengkapan, legalitas, atau kesesuaian seluruh konten yang tersedia dalam database pihak ketiga.{'\n\n'}
          Pengguna bertanggung jawab untuk meninjau dan menggunakan database tambahan secara bijaksana.
        </Section>

        <Section title="5. Penggunaan yang Diizinkan">
          Pengguna diperbolehkan menggunakan aplikasi ini untuk:{'\n'}
          • Ibadah pribadi{'\n'}
          • Ibadah gereja{'\n'}
          • Pelayanan{'\n'}
          • Pembelajaran{'\n'}
          • Kegiatan non-komersial lainnya{'\n\n'}
          Penggunaan aplikasi harus tetap menghormati hak cipta dan ketentuan yang berlaku atas setiap lagu atau materi yang digunakan.
        </Section>

        <Section title="6. Larangan Penggunaan Komersial">
          Pengguna tidak diperkenankan untuk:{'\n'}
          • Menjual aplikasi ini atau bagian darinya.{'\n'}
          • Menjual database bawaan yang disediakan dalam aplikasi.{'\n'}
          • Menggunakan konten aplikasi untuk memperoleh keuntungan komersial tanpa izin dari pemegang hak cipta yang sah.{'\n'}
          • Menggandakan, mendistribusikan, atau mempublikasikan ulang materi dalam aplikasi untuk tujuan komersial tanpa izin yang diperlukan.
        </Section>

        <Section title="7. Distribusi Database">
          Pembuat database komunitas bertanggung jawab atas seluruh konten yang mereka distribusikan melalui mekanisme yang didukung aplikasi.{'\n\n'}
          Dengan membagikan database kepada pengguna lain, pembuat database menyatakan bahwa mereka memiliki hak yang diperlukan atau telah memperoleh izin yang sesuai atas materi yang didistribusikan.{'\n\n'}
          Pengembang aplikasi tidak bertanggung jawab atas pelanggaran hak cipta yang dilakukan oleh pihak ketiga melalui database eksternal.
        </Section>

        <Section title="8. Permintaan Koreksi dan Penghapusan Konten">
          Apabila Anda merupakan pencipta, penerbit, organisasi, atau pemegang hak cipta dari materi yang terdapat dalam aplikasi ini dan memiliki keberatan terhadap penggunaannya, silakan menghubungi pengembang.{'\n\n'}
          Permintaan yang sah akan ditinjau dengan itikad baik dan dapat ditindaklanjuti dalam bentuk:{'\n'}
          • Perbaikan informasi atribusi{'\n'}
          • Pembaruan data lagu{'\n'}
          • Penghapusan konten{'\n'}
          • Tindakan lain yang dianggap sesuai
        </Section>

        <Section title="9. Batasan Tanggung Jawab">
          Aplikasi disediakan sebagaimana adanya ("as is").{'\n\n'}
          Pengembang tidak memberikan jaminan mengenai:{'\n'}
          • Kelengkapan seluruh data lagu{'\n'}
          • Keakuratan seluruh informasi yang tersedia{'\n'}
          • Ketersediaan layanan setiap saat{'\n'}
          • Kesesuaian konten dengan kebutuhan pengguna tertentu{'\n\n'}
          Pengembang tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul akibat penggunaan aplikasi atau penggunaan database pihak ketiga.
        </Section>

        <Section title="10. Moderasi dan Pembatasan Konten">
          Pengembang berhak untuk:{'\n'}
          • Menghapus referensi database tertentu{'\n'}
          • Menolak distribusi database tertentu{'\n'}
          • Membatasi akses terhadap database tertentu{'\n\n'}
          apabila ditemukan indikasi pelanggaran hak cipta, penyalahgunaan layanan, spam, malware, atau konten lain yang dianggap tidak sesuai dengan tujuan aplikasi.
        </Section>

        <Section title="11. Perubahan Ketentuan">
          Disclaimer dan syarat penggunaan ini dapat diperbarui sewaktu-waktu untuk menyesuaikan perkembangan aplikasi maupun kebutuhan operasional.{'\n\n'}
          Penggunaan aplikasi setelah perubahan dilakukan dianggap sebagai persetujuan terhadap versi terbaru dari ketentuan ini.
        </Section>

        <Section title="12. Kontak" isLast>
          Untuk pertanyaan, koreksi data, laporan pelanggaran hak cipta, atau permintaan penghapusan konten, pengguna dapat menghubungi pengembang melalui informasi kontak yang disediakan pada halaman aplikasi.
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, isLast }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <View className={`mb-6 ${isLast ? '' : 'border-b border-slate-200 dark:border-slate-800 pb-6'}`}>
      <Text className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
        {title}
      </Text>
      <Text className="text-[15px] leading-6 text-slate-600 dark:text-slate-300">
        {children}
      </Text>
    </View>
  );
}
