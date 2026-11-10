import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function requireUser(roles = []) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Sesi tidak valid. Silakan masuk kembali.', status: 401 };
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) return { error: 'Profil belum tersedia. Hubungi administrator.', status: 403 };
  if (roles.length && !roles.includes(profile.role)) return { error: 'Kamu tidak memiliki akses untuk tindakan ini.', status: 403 };
  return { user, profile };
}
