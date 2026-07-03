-- Fase 1 da sincronização entre aparelhos: só a tabela de Lembretes (prova de
-- conceito). Cole este arquivo inteiro no SQL Editor do painel do Supabase
-- (supabase.com > seu projeto > SQL Editor > New query) e rode uma vez.
--
-- Não precisa criar tabela de usuários — o Supabase Auth já cuida disso
-- (auth.users). Cada linha aqui pertence a um usuário via user_id, e a
-- Row Level Security (RLS) abaixo garante que ninguém vê/edita dado de outra
-- conta, mesmo com a chave anônima pública do app.

create table if not exists public.reminders (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  date_time timestamptz not null,
  type text not null default 'OUTRO',
  priority text not null default 'MEDIA',
  done boolean not null default false,
  from_note boolean not null default false,
  is_birthday boolean not null default false,
  birth_year integer,
  -- Tombstone de exclusão: marca "apagado" em vez de remover a linha de
  -- verdade, senão um aparelho que ainda não puxou a exclusão ressuscitaria
  -- o lembrete ao empurrar sua própria cópia (ainda não deletada) de volta.
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Índice usado pela sincronização: "me dê tudo que mudou depois de X".
create index if not exists reminders_user_updated_idx
  on public.reminders (user_id, updated_at);

alter table public.reminders enable row level security;

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own"
  on public.reminders for select
  using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own"
  on public.reminders for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own"
  on public.reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sem policy de "delete": exclusão sempre vira update (deleted = true), pelo
-- motivo do tombstone explicado acima.
