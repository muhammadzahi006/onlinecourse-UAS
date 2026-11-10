-- Prisma db push creates the relational schema. This migration adds Supabase Auth sync and RLS.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role, created_at)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 'STUDENT', now())
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.rate_limit_buckets enable row level security;

create or replace function public.current_role() returns text language sql stable security definer set search_path = '' as $$
 select role::text from public.profiles where id = (select auth.uid()); $$;
create policy "profiles self or course staff read" on public.profiles for select to authenticated using (profiles.id = (select auth.uid()) or public.current_role() = 'ADMIN' or exists(select 1 from public.enrollments e join public.courses c on c.id=e.course_id where e.student_id=profiles.id and c.instructor_id=(select auth.uid())));
create policy "categories visible" on public.categories for select to anon, authenticated using (true);
create policy "courses published visible" on public.courses for select to anon, authenticated using (status = 'PUBLISHED' or instructor_id = (select auth.uid()) or public.current_role() = 'ADMIN');
create policy "instructor owns courses" on public.courses for all to authenticated using (instructor_id = (select auth.uid()) and public.current_role() = 'INSTRUCTOR' or public.current_role() = 'ADMIN') with check (instructor_id = (select auth.uid()) and public.current_role() = 'INSTRUCTOR' or public.current_role() = 'ADMIN');
create policy "published lessons visible" on public.lessons for select to anon, authenticated using (exists(select 1 from public.courses c where c.id = course_id and (c.status='PUBLISHED' or c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "course instructor manages lessons" on public.lessons for all to authenticated using (exists(select 1 from public.courses c where c.id=course_id and (c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN'))) with check (exists(select 1 from public.courses c where c.id=course_id and (c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "enrollments owned or instructor" on public.enrollments for select to authenticated using (student_id=(select auth.uid()) or exists(select 1 from public.courses c where c.id=course_id and (c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "student enroll self" on public.enrollments for insert to authenticated with check (student_id=(select auth.uid()) and public.current_role()='STUDENT' and exists(select 1 from public.courses c where c.id=course_id and c.status='PUBLISHED'));
create policy "progress owner or course instructor" on public.lesson_progress for select to authenticated using (student_id=(select auth.uid()) or exists(select 1 from public.lessons l join public.courses c on c.id=l.course_id where l.id=lesson_id and (c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "student records own progress" on public.lesson_progress for insert to authenticated with check (student_id=(select auth.uid()) and public.current_role()='STUDENT' and exists(select 1 from public.lessons l join public.enrollments e on e.course_id=l.course_id where l.id=lesson_id and e.student_id=(select auth.uid())));
create policy "quiz visible for published courses" on public.quizzes for select to anon, authenticated using (exists(select 1 from public.courses c where c.id=course_id and (c.status='PUBLISHED' or c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "attempt owner or instructor" on public.quiz_attempts for select to authenticated using (student_id=(select auth.uid()) or exists(select 1 from public.quizzes q join public.courses c on c.id=q.course_id where q.id=quiz_id and (c.instructor_id=(select auth.uid()) or public.current_role()='ADMIN')));
create policy "student submits own attempt" on public.quiz_attempts for insert to authenticated with check (student_id=(select auth.uid()) and public.current_role()='STUDENT' and exists(select 1 from public.quizzes q join public.enrollments e on e.course_id=q.course_id where q.id=quiz_id and e.student_id=(select auth.uid())));
create policy "push subscription owner" on public.push_subscriptions for all to authenticated using (profile_id=(select auth.uid())) with check (profile_id=(select auth.uid()));
create policy "notification owner read" on public.notification_jobs for select to authenticated using (profile_id=(select auth.uid()));
