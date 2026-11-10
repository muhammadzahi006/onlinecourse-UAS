import './globals.css';

export const metadata = { title: 'RuangBelajar — Belajar hal besar, mulai dari sini', description: 'Temukan kelas pilihan, belajar bersama mentor terbaik, dan wujudkan versi terbaik dirimu.' };

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
