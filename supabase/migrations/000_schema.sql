-- Core PostgreSQL schema. Apply before 001_init.sql in a fresh Supabase project.
create extension if not exists pgcrypto;
create type public."Role" as enum ('STUDENT', 'INSTRUCTOR', 'ADMIN');
create type public."CourseStatus" as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

create table public.profiles (id uuid primary key, full_name text not null, role public."Role" not null default 'STUDENT', created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique);
create table public.courses (
 id uuid primary key default gen_random_uuid(), instructor_id uuid not null references public.profiles(id) on delete restrict,
 category_id uuid not null references public.categories(id) on delete restrict, title text not null check (length(btrim(title)) > 0), slug text not null unique,
 description text not null, level text not null check (level in ('PEMULA','MENENGAH','LANJUTAN','SEMUA LEVEL')), price integer not null default 0 check (price >= 0),
 status public."CourseStatus" not null default 'DRAFT', thumbnail_url text, created_at timestamptz not null default now()
);
create index courses_status_category_idx on public.courses(status, category_id);
create table public.lessons (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 title text not null, position integer not null check (position > 0), content_url text, content_text text, unique(course_id, position)
);
create table public.enrollments (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade, enrolled_at timestamptz not null default now(), unique(student_id, course_id)
);
create table public.lesson_progress (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 lesson_id uuid not null references public.lessons(id) on delete cascade, completed_at timestamptz not null default now(), unique(student_id, lesson_id)
);
create table public.quizzes (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 title text not null, questions jsonb not null
);
create table public.quiz_answers (
 id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
 question_index integer not null check (question_index >= 0), correct_option integer not null check (correct_option >= 0), unique(quiz_id, question_index)
);
create table public.quiz_attempts (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 quiz_id uuid not null references public.quizzes(id) on delete cascade, answers jsonb not null,
 score integer not null check (score between 0 and 100), submitted_at timestamptz not null default now()
);
create index quiz_attempts_student_quiz_idx on public.quiz_attempts(student_id, quiz_id);
create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
 endpoint text not null unique, p256dh text not null, auth text not null, created_at timestamptz not null default now()
);
create table public.notification_jobs (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, body text not null, url text not null, created_at timestamptz not null default now()
);
create index notification_jobs_created_at_idx on public.notification_jobs(created_at);
create table public.rate_limit_buckets (
 bucket_key text primary key, hit_count integer not null check (hit_count >= 0), reset_at timestamptz not null
);
