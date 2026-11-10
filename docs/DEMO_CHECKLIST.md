# Checklist demo dan verifikasi

Jalankan setelah migrations dan seed diterapkan. Untuk uji role, daftarkan tiga akun melalui aplikasi. Biarkan satu sebagai peserta; ubah role akun kedua ke `INSTRUCTOR` dan ketiga ke `ADMIN` lewat SQL Editor. Jangan membagikan password asli saat demo.

## 1. Frontend dan validasi request

- Pada `/dashboard/kursus/baru`, kirim formulir kosong; browser harus meminta field wajib.
- Masukkan harga negatif, judul terlalu pendek, slug dengan spasi, serta jawaban benar di luar pilihan. UI/backend harus menolak nilai yang tidak sesuai.
- Sebagai peserta, klik daftar kursus dua kali. Tombol hanya mengirim sekali dan pendaftaran kedua menerima pesan bahwa peserta sudah terdaftar.
- Kirim request berulang ke endpoint protected; setelah ambang pengguna tercapai server menjawab 429 dengan header `Retry-After`.
- Coba tandai materi selesai, kirim kuis tanpa jawaban, dan pilih jawaban. Pesan berhasil/error terlihat.

## 2. Validasi backend tanpa UI

Ganti `APP_URL` dan `SESSION_COOKIE` dengan alamat Vercel/lokal dan cookie sesi peserta yang disalin dari DevTools browser. Jangan membagikan cookie sesi:

```sh
curl -i -X POST "$APP_URL/api/enrollments" \
  -H "Cookie: $SESSION_COOKIE" \
  -H 'Content-Type: application/json' \
  -d '{"courseId":"bukan-uuid"}'
```

Permintaan harus ditolak sebagai 400; tanpa cookie hasilnya 401. Ulangi dengan UUID kursus yang benar, lalu kirim ulang. Permintaan pertama membuat enrollment; pengulangan ditolak dengan 409. Cookie hanya digunakan lokal dan tidak dimasukkan repository.

## 3. Constraint database dan persistensi

- Pastikan `enrollments` mempunyai constraint unik `(student_id, course_id)` dan foreign key ke `profiles` serta `courses`.
- Coba `insert into courses (..., price, ...) values (..., -1, ...)`; PostgreSQL harus menolak `CHECK price >= 0`.
- Coba nilai kuis di luar 0–100; constraint database menolaknya.
- Selesaikan materi dan kuis, refresh halaman, logout/login, lalu pastikan progres/nilai tetap ada.
- Jalankan seed ulang; jumlah kategori, kursus, materi, pendaftaran, dan progres contoh tidak bertambah ganda.

## 4. Autentikasi, otorisasi, dan RLS

- Buka `/dashboard` dan `/belajar/<course-id>` tanpa login; middleware mengarahkan ke `/login`.
- Sebagai peserta A, ganti ID kursus/progres ke milik peserta B. Materi/progres/nilai tidak dapat dibaca atau diubah oleh A.
- Sebagai pengajar, buka kursus milik pengajar lain. Halaman pengelolaan harus menjawab 404.
- Dari Supabase client terautentikasi sebagai peserta, coba membaca `quiz_answers`; RLS tidak mengembalikan kunci jawaban.
- Ubah profil melalui formulir biasa tidak dapat mengubah role. Role hanya dipromosikan dari lingkungan admin/SQL Editor.

## 5. Web Push dan background worker

- Jalankan Redis, lalu jalankan `npm run worker` pada terminal/proses terpisah dengan `REDIS_URL`, koneksi DB, dan VAPID keys yang sama dengan aplikasi.
- Masuk sebagai peserta dan klik **Izinkan notifikasi** satu kali bila izin browser belum diberikan. Setelah izin aktif, dashboard otomatis menyimpan subscription pada kunjungan berikutnya. Uji juga kondisi browser tidak mendukung push dan izin ditolak.
- Daftar kursus. Pendaftaran harus tetap sukses; antrean worker mencatat job dan browser menerima Web Push berisi judul kursus. Klik notifikasi dan periksa halaman tujuan.
- Matikan worker sementara, daftar akun uji baru, hidupkan worker kembali. Job antrean diproses. Log worker menunjukkan job selesai/gagal dan jumlah subscription.
- Hapus subscription browser dari tabel untuk simulasi endpoint tidak valid; worker menghapus subscription saat menerima HTTP 404/410.

## 6. Log dan deployment

- Periksa log proses Next.js untuk `enrollment_failed`, `course_create_failed`, atau `push_enqueue_failed`.
- Periksa log worker untuk `push_job_complete`, `push_job_failed`, dan `worker_error`.
- Jalankan alur daftar, refresh, dan buka URL kursus langsung pada URL HTTPS Vercel. Pastikan URL Supabase, DB, Redis, dan VAPID production diatur melalui environment variables.

Checklist ini adalah panduan demonstrasi; tiap role perlu akun uji Supabase tersendiri dan push production memerlukan HTTPS.
