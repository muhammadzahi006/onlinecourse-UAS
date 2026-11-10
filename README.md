# RuangBelajar — Platform Online Course

Proyek akhir Kelompok 6. Aplikasi Next.js (JavaScript) dengan Supabase Auth, PostgreSQL, Prisma, validasi Zod, dan Web Push melalui worker BullMQ/Redis.

Catatan requirement: dokumen teknis menyebut JavaScript pada bagian stack wajib namun TypeScript pada bagian kualitas kode. Implementasi mengikuti stack eksplisit JavaScript dan spreadsheet proyek Kelompok 6.

## Mulai lokal

1. Pasang Node.js 20+ dan buat project Supabase.
2. Salin `.env.example` menjadi `.env.local`, lalu isi URL dan anon key Supabase, `DATABASE_URL` (pooler PostgreSQL), dan `DIRECT_URL` (koneksi langsung untuk schema).
3. Jalankan `npm install`.
4. Jalankan SQL `supabase/migrations/000_schema.sql` lalu `supabase/migrations/001_init.sql` secara berurutan melalui Supabase SQL Editor (atau tool migrasi PostgreSQL).
5. Jalankan `npx prisma generate` dan `npm run db:seed`. `npx prisma db push` tersedia untuk eksplorasi schema lokal; deployment sebaiknya memakai SQL migration yang tersimpan di repository.
6. Jalankan `npm run dev`.

Pengguna dibuat melalui halaman Daftar. Trigger Supabase membuat profil peserta. Role tidak dapat dipilih dari formulir browser. Promosikan akun secara manual setelah dibuat, misalnya `npm run db:promote-admin -- user@example.com` untuk admin atau SQL Editor untuk role pengajar.

## Web Push dan worker

Siapkan pasangan VAPID sekali dengan `npm run vapid:generate` (kunci disimpan di `.env` yang di-ignore Git), lalu isi `REDIS_URL`. Worker berjalan terpisah dengan `npm run worker`. Setelah izin notifikasi diberikan, dashboard otomatis mendaftarkan browser dan menyimpan subscription; pada kunjungan pertama browser tetap meminta satu interaksi untuk memberikan izin. Pendaftaran kelas tersimpan di PostgreSQL dan memasukkan job ke antrean Redis; worker mengirim push dengan retry hingga tiga kali. Worker menghapus subscription yang sudah tidak valid dan mencatat kegagalan dalam log.

Untuk demo lokal, Redis dapat dijalankan dengan Docker (`docker run --name ruangbelajar-redis -p 6379:6379 -d redis:7-alpine`). Untuk deployment worker, gunakan layanan worker/container terpisah dan Redis yang dapat dijangkau worker serta aplikasi.

## Alur fitur

- Landing page menampilkan kategori dan kursus terpublikasi dari database. `/kursus` menyediakan pencarian nama/deskripsi/pengajar, filter kategori, dan pagination.
- Supabase Auth menyediakan pendaftaran, login, dan logout. Rute dashboard dan belajar meminta sesi aktif.
- Login admin tersedia pada `/admin/login`; route memverifikasi role `ADMIN` di server.
- Peserta mendaftar kursus; batas unik database mencegah pendaftaran ganda. Peserta hanya membuka materi, progres, dan nilai miliknya.
- Pengajar dan admin membuat kursus berisi materi dan kuis, lalu memublikasikan draft. Dashboard menampilkan peserta dan nilai kursus milik pengajar. Hak akses dicek di server; RLS melindungi akses langsung ke tabel dari Supabase.
- Materi selesai dan nilai kuis disimpan di PostgreSQL. Materi kuis contoh tersimpan sebagai JSON pada baris kuis.
- Endpoint pendaftaran, progres, kuis, subscription push, dan operasi pengajar dibatasi per pengguna memakai atomic PostgreSQL rate-limit buckets. Supabase Auth login/signup dapat dibatasi dari Authentication settings project.
- Kategori, kursus, materi, kuis, pendaftaran, progres, nilai, profil, dan subscription menggunakan foreign key/unique constraints.

## Data contoh

`npm run db:seed` menambahkan 5 kategori, 5 kursus, materi, kuis, pendaftaran, progres, dan nilai contoh. Setelah seed, jalankan `npm run db:demo-accounts` dengan environment variable `DEMO_ACCOUNT_PASSWORD` untuk membuat 5 akun Auth pengajar dan 5 peserta, lalu menghubungkannya ke kursus serta progres dummy. Skrip mencetak daftar email dan role; kata sandi yang dipakai adalah nilai `DEMO_ACCOUNT_PASSWORD`. Akun admin dibuat terpisah melalui pendaftaran biasa dan dipromosikan menggunakan `npm run db:promote-admin -- email@example.com`.

## Deploy GitHub → Vercel + Supabase

1. Push source ke repository GitHub.
2. Impor repository di Vercel, atur seluruh environment variable dari `.env.example`, lalu deploy.
3. Jalankan kedua SQL migration Supabase secara berurutan, `npm run db:seed` satu kali, dan pastikan Prisma Client tergenerasi saat build.
4. Deploy `worker/` sebagai proses Node.js terpisah dengan `REDIS_URL`, `DATABASE_URL`, dan kunci VAPID. Worker tidak berjalan di fungsi serverless Vercel.
5. Push notification pada deployment memerlukan HTTPS. Cloudflare dapat dipasang opsional sebagai DNS/proxy; tidak dibutuhkan untuk alur inti.

## Struktur dan batasan saat ini

- `app/`: UI responsif, dashboard, halaman belajar, API route handlers.
- `prisma/schema.prisma`: skema relational PostgreSQL.
- `supabase/migrations/`: schema PostgreSQL, trigger Auth, kebijakan RLS, dan constraint.
- `worker/index.js`: worker Web Push asynchronous.
- `docs/ERD.md` dan `docs/DEMO_CHECKLIST.md`: relasi database dan alur pembuktian fitur.

Fitur peserta, pengajar, serta panel admin untuk pengelolaan role, kategori, dan publikasi kursus tersedia. Integrasi pembayaran dan upload video/file belum termasuk; harga kursus saat ini hanya informasi. Web Push memerlukan Redis aktif dan proses worker terpisah agar notifikasi benar-benar terkirim. Deployment GitHub/Vercel harus dikonfigurasi untuk environment proyek sebelum dapat dinyatakan siap.
