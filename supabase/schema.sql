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

-- GRANT é uma camada ANTES da RLS: sem isso o Postgres barra o acesso à
-- tabela inteira pro papel "authenticated" (o que o PostgREST usa em nome de
-- qualquer usuário logado), e a RLS abaixo nunca chega a ser avaliada — o
-- erro nesse caso é "permission denied for table", não algo sobre a policy.
-- Sem grant de delete (de propósito): exclusão sempre vira update (deleted
-- = true), pelo motivo do tombstone explicado abaixo.
grant usage on schema public to authenticated;
grant select, insert, update on public.reminders to authenticated;

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


-- ============================================================
-- Fase 2: Notas/Listas, Despesas, Contas, Carteira e Alarmes.
-- Mesmo padrão de cima (tombstone + updated_at + RLS + GRANT) em cada uma.
-- ============================================================

create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'NOTA',
  title text not null,
  content text not null default '',
  items jsonb,
  created_at timestamptz not null default now(),
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at);
grant select, insert, update on public.notes to authenticated;
alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  description text,
  date timestamptz not null,
  installment_group_id text,
  installment_index integer,
  installment_total integer,
  superficial boolean not null default false,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists expenses_user_updated_idx on public.expenses (user_id, updated_at);
grant select, insert, update on public.expenses to authenticated;
alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


create table if not exists public.bills (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  amount numeric not null,
  due_date timestamptz not null,
  type text not null default 'OUTRO',
  kind text not null default 'PAGAR',
  status text not null default 'PENDENTE',
  priority boolean not null default false,
  paid_date timestamptz,
  recurring boolean not null default false,
  recurrence_id text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists bills_user_updated_idx on public.bills (user_id, updated_at);
grant select, insert, update on public.bills to authenticated;
alter table public.bills enable row level security;

drop policy if exists "bills_select_own" on public.bills;
create policy "bills_select_own" on public.bills for select using (auth.uid() = user_id);
drop policy if exists "bills_insert_own" on public.bills;
create policy "bills_insert_own" on public.bills for insert with check (auth.uid() = user_id);
drop policy if exists "bills_update_own" on public.bills;
create policy "bills_update_own" on public.bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Carteira: uma linha só por conta (não é uma lista) — user_id é a própria
-- chave primária, sem tombstone (não existe "excluir" a carteira no app).
create table if not exists public.wallet (
  user_id uuid primary key references auth.users (id) on delete cascade,
  base_amount numeric not null default 0,
  base_set_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.wallet to authenticated;
alter table public.wallet enable row level security;

drop policy if exists "wallet_select_own" on public.wallet;
create policy "wallet_select_own" on public.wallet for select using (auth.uid() = user_id);
drop policy if exists "wallet_insert_own" on public.wallet;
create policy "wallet_insert_own" on public.wallet for insert with check (auth.uid() = user_id);
drop policy if exists "wallet_update_own" on public.wallet;
create policy "wallet_update_own" on public.wallet for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


create table if not exists public.alarms (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  time text not null,
  label text,
  enabled boolean not null default true,
  last_handled_date text,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists alarms_user_updated_idx on public.alarms (user_id, updated_at);
grant select, insert, update on public.alarms to authenticated;
alter table public.alarms enable row level security;

drop policy if exists "alarms_select_own" on public.alarms;
create policy "alarms_select_own" on public.alarms for select using (auth.uid() = user_id);
drop policy if exists "alarms_insert_own" on public.alarms;
create policy "alarms_insert_own" on public.alarms for insert with check (auth.uid() = user_id);
drop policy if exists "alarms_update_own" on public.alarms;
create policy "alarms_update_own" on public.alarms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
