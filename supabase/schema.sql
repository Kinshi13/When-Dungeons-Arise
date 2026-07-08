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


-- ============================================================
-- Baka Studio — autenticação, workspaces e sincronização local-first.
--
-- Mesmo padrão das tabelas acima (tombstone `deleted boolean` + `updated_at`
-- + RLS + GRANT sem delete), mas com uma diferença: os dados aqui pertencem
-- a um WORKSPACE, não diretamente a um usuário — várias tabelas (channels,
-- projects, ...) por baixo de um workspace_id, e o acesso é resolvido via
-- workspace_members. Isso já deixa o modelo pronto pra colaboração em
-- equipe no futuro, mesmo o app funcionando hoje essencialmente para um
-- usuário só (dono único do seu workspace).
--
-- IDs: todo id é o mesmo UUID gerado no cliente (Drift) — nunca um id
-- gerado pelo Postgres — para que push seja idempotente (upsert por id).
-- ============================================================

-- Trigger genérica de updated_at para as tabelas Baka Studio — o servidor
-- é a fonte de verdade final do timestamp em qualquer escrita bem-sucedida,
-- o cliente só manda um valor provisório que é sempre substituído aqui.
create or replace function public.baka_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Função auxiliar usada por toda policy abaixo: evita repetir a mesma
-- subquery em cada tabela e centraliza a regra "eu pertenço a esse
-- workspace?" num único lugar. Definida em plpgsql (não sql) de propósito:
-- seu corpo referencia baka_workspace_members, que só é criada mais abaixo
-- neste mesmo arquivo — e, ao contrário de `language sql`, o Postgres não
-- valida o corpo de uma função plpgsql contra o catálogo na criação, só na
-- primeira execução, o que evita uma dependência circular de ordem entre
-- esta função e a policy de select de baka_workspaces (que já precisa dela).
create or replace function public.is_baka_workspace_member(ws_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1 from public.baka_workspace_members m
    where m.workspace_id = ws_id and m.user_id = auth.uid()
  );
end;
$$;

-- ---------- profiles ----------

create table if not exists public.baka_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.baka_profiles to authenticated;
alter table public.baka_profiles enable row level security;

drop policy if exists "baka_profiles_select_own" on public.baka_profiles;
create policy "baka_profiles_select_own" on public.baka_profiles for select using (auth.uid() = id);
drop policy if exists "baka_profiles_update_own" on public.baka_profiles;
create policy "baka_profiles_update_own" on public.baka_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Sem policy de insert: profile é criado só pelo trigger abaixo (security
-- definer), nunca diretamente pelo cliente.

drop trigger if exists baka_profiles_set_updated_at on public.baka_profiles;
create trigger baka_profiles_set_updated_at before update on public.baka_profiles
  for each row execute function public.baka_set_updated_at();

-- ---------- workspaces + membership ----------

create table if not exists public.baka_workspaces (
  id uuid primary key,
  name text not null,
  description text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
grant select, insert, update on public.baka_workspaces to authenticated;
alter table public.baka_workspaces enable row level security;

drop policy if exists "baka_workspaces_select_member" on public.baka_workspaces;
create policy "baka_workspaces_select_member" on public.baka_workspaces for select
  using (public.is_baka_workspace_member(id));
drop policy if exists "baka_workspaces_insert_owner" on public.baka_workspaces;
create policy "baka_workspaces_insert_owner" on public.baka_workspaces for insert
  with check (auth.uid() = owner_id);
drop policy if exists "baka_workspaces_update_owner" on public.baka_workspaces;
create policy "baka_workspaces_update_owner" on public.baka_workspaces for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop trigger if exists baka_workspaces_set_updated_at on public.baka_workspaces;
create trigger baka_workspaces_set_updated_at before update on public.baka_workspaces
  for each row execute function public.baka_set_updated_at();

create table if not exists public.baka_workspace_members (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner', -- owner | admin | editor | viewer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
grant select, insert, update on public.baka_workspace_members to authenticated;
alter table public.baka_workspace_members enable row level security;

drop policy if exists "baka_workspace_members_select_member" on public.baka_workspace_members;
create policy "baka_workspace_members_select_member" on public.baka_workspace_members for select
  using (public.is_baka_workspace_member(workspace_id));
-- Insert/update de membership ficam restritos ao owner do workspace — não
-- expostos nesta fase (sem UI de convite ainda), só usados pelo bootstrap.
drop policy if exists "baka_workspace_members_insert_owner" on public.baka_workspace_members;
create policy "baka_workspace_members_insert_owner" on public.baka_workspace_members for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.baka_workspaces w where w.id = workspace_id and w.owner_id = auth.uid())
  );

drop trigger if exists baka_workspace_members_set_updated_at on public.baka_workspace_members;
create trigger baka_workspace_members_set_updated_at before update on public.baka_workspace_members
  for each row execute function public.baka_set_updated_at();

-- Bootstrap automático: ao criar a conta (auth.users), cria profile +
-- workspace inicial + membership como owner, tudo numa transação. O nome
-- "Meu workspace" é um padrão genérico — não é acoplado a "Rede Baka", que é
-- só o seed de demonstração do dono original do projeto (inserido pelo
-- cliente localmente, nunca por este trigger).
create or replace function public.baka_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid := gen_random_uuid();
begin
  insert into public.baka_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.baka_workspaces (id, name, owner_id)
  values (new_workspace_id, 'Meu workspace', new.id);

  insert into public.baka_workspace_members (id, workspace_id, user_id, role)
  values (gen_random_uuid(), new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists baka_on_auth_user_created on auth.users;
create trigger baka_on_auth_user_created
  after insert on auth.users
  for each row execute function public.baka_handle_new_user();

-- ---------- entidades do produto ----------
-- Todas seguem o mesmo esqueleto: id (uuid do cliente), workspace_id,
-- updated_at, deleted (tombstone), RLS via is_baka_workspace_member.

create table if not exists public.baka_channels (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  name text not null,
  handle text,
  niche text not null default '',
  objective text not null default '',
  description text not null default '',
  color integer not null,
  audience text,
  desired_frequency text,
  status text not null default 'planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted boolean not null default false
);
create index if not exists baka_channels_ws_updated_idx on public.baka_channels (workspace_id, updated_at);
grant select, insert, update on public.baka_channels to authenticated;
alter table public.baka_channels enable row level security;
drop policy if exists "baka_channels_select" on public.baka_channels;
create policy "baka_channels_select" on public.baka_channels for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_channels_insert" on public.baka_channels;
create policy "baka_channels_insert" on public.baka_channels for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_channels_update" on public.baka_channels;
create policy "baka_channels_update" on public.baka_channels for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_channels_set_updated_at on public.baka_channels;
create trigger baka_channels_set_updated_at before update on public.baka_channels for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_projects (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'idea',
  priority text not null default 'medium',
  start_date timestamptz,
  target_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted boolean not null default false
);
create index if not exists baka_projects_ws_updated_idx on public.baka_projects (workspace_id, updated_at);
grant select, insert, update on public.baka_projects to authenticated;
alter table public.baka_projects enable row level security;
drop policy if exists "baka_projects_select" on public.baka_projects;
create policy "baka_projects_select" on public.baka_projects for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_projects_insert" on public.baka_projects;
create policy "baka_projects_insert" on public.baka_projects for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_projects_update" on public.baka_projects;
create policy "baka_projects_update" on public.baka_projects for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_projects_set_updated_at on public.baka_projects;
create trigger baka_projects_set_updated_at before update on public.baka_projects for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_project_channels (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  project_id uuid not null references public.baka_projects (id) on delete cascade,
  channel_id uuid not null references public.baka_channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  unique (project_id, channel_id)
);
create index if not exists baka_project_channels_ws_updated_idx on public.baka_project_channels (workspace_id, updated_at);
grant select, insert, update on public.baka_project_channels to authenticated;
alter table public.baka_project_channels enable row level security;
drop policy if exists "baka_project_channels_select" on public.baka_project_channels;
create policy "baka_project_channels_select" on public.baka_project_channels for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_channels_insert" on public.baka_project_channels;
create policy "baka_project_channels_insert" on public.baka_project_channels for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_channels_update" on public.baka_project_channels;
create policy "baka_project_channels_update" on public.baka_project_channels for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_project_channels_set_updated_at on public.baka_project_channels;
create trigger baka_project_channels_set_updated_at before update on public.baka_project_channels for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_project_nodes (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  project_id uuid not null references public.baka_projects (id) on delete cascade,
  title text not null,
  state text not null default 'planned',
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists baka_project_nodes_ws_updated_idx on public.baka_project_nodes (workspace_id, updated_at);
grant select, insert, update on public.baka_project_nodes to authenticated;
alter table public.baka_project_nodes enable row level security;
drop policy if exists "baka_project_nodes_select" on public.baka_project_nodes;
create policy "baka_project_nodes_select" on public.baka_project_nodes for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_nodes_insert" on public.baka_project_nodes;
create policy "baka_project_nodes_insert" on public.baka_project_nodes for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_nodes_update" on public.baka_project_nodes;
create policy "baka_project_nodes_update" on public.baka_project_nodes for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_project_nodes_set_updated_at on public.baka_project_nodes;
create trigger baka_project_nodes_set_updated_at before update on public.baka_project_nodes for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_project_node_relations (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  project_id uuid not null references public.baka_projects (id) on delete cascade,
  source_node_id uuid not null,
  target_node_id uuid not null,
  type text not null default 'dependency',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists baka_project_node_relations_ws_updated_idx on public.baka_project_node_relations (workspace_id, updated_at);
grant select, insert, update on public.baka_project_node_relations to authenticated;
alter table public.baka_project_node_relations enable row level security;
drop policy if exists "baka_project_node_relations_select" on public.baka_project_node_relations;
create policy "baka_project_node_relations_select" on public.baka_project_node_relations for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_node_relations_insert" on public.baka_project_node_relations;
create policy "baka_project_node_relations_insert" on public.baka_project_node_relations for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_project_node_relations_update" on public.baka_project_node_relations;
create policy "baka_project_node_relations_update" on public.baka_project_node_relations for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_project_node_relations_set_updated_at on public.baka_project_node_relations;
create trigger baka_project_node_relations_set_updated_at before update on public.baka_project_node_relations for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_content_items (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  title text not null,
  description text not null default '',
  format text not null default 'video',
  stage text not null default 'inbox',
  priority text not null default 'medium',
  project_id uuid,
  due_date timestamptz,
  published_at timestamptz,
  platform text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted boolean not null default false
);
create index if not exists baka_content_items_ws_updated_idx on public.baka_content_items (workspace_id, updated_at);
grant select, insert, update on public.baka_content_items to authenticated;
alter table public.baka_content_items enable row level security;
drop policy if exists "baka_content_items_select" on public.baka_content_items;
create policy "baka_content_items_select" on public.baka_content_items for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_content_items_insert" on public.baka_content_items;
create policy "baka_content_items_insert" on public.baka_content_items for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_content_items_update" on public.baka_content_items;
create policy "baka_content_items_update" on public.baka_content_items for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_content_items_set_updated_at on public.baka_content_items;
create trigger baka_content_items_set_updated_at before update on public.baka_content_items for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_content_channels (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  content_item_id uuid not null references public.baka_content_items (id) on delete cascade,
  channel_id uuid not null references public.baka_channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  unique (content_item_id, channel_id)
);
create index if not exists baka_content_channels_ws_updated_idx on public.baka_content_channels (workspace_id, updated_at);
grant select, insert, update on public.baka_content_channels to authenticated;
alter table public.baka_content_channels enable row level security;
drop policy if exists "baka_content_channels_select" on public.baka_content_channels;
create policy "baka_content_channels_select" on public.baka_content_channels for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_content_channels_insert" on public.baka_content_channels;
create policy "baka_content_channels_insert" on public.baka_content_channels for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_content_channels_update" on public.baka_content_channels;
create policy "baka_content_channels_update" on public.baka_content_channels for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_content_channels_set_updated_at on public.baka_content_channels;
create trigger baka_content_channels_set_updated_at before update on public.baka_content_channels for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_tasks (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  channel_id uuid,
  project_id uuid,
  content_item_id uuid,
  campaign_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists baka_tasks_ws_updated_idx on public.baka_tasks (workspace_id, updated_at);
grant select, insert, update on public.baka_tasks to authenticated;
alter table public.baka_tasks enable row level security;
drop policy if exists "baka_tasks_select" on public.baka_tasks;
create policy "baka_tasks_select" on public.baka_tasks for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_tasks_insert" on public.baka_tasks;
create policy "baka_tasks_insert" on public.baka_tasks for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_tasks_update" on public.baka_tasks;
create policy "baka_tasks_update" on public.baka_tasks for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_tasks_set_updated_at on public.baka_tasks;
create trigger baka_tasks_set_updated_at before update on public.baka_tasks for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_inbox_items (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  type text not null default 'ideia',
  title text not null,
  body text not null default '',
  source text,
  channel_id uuid,
  processed boolean not null default false,
  processed_at timestamptz,
  converted_entity_type text,
  converted_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists baka_inbox_items_ws_updated_idx on public.baka_inbox_items (workspace_id, updated_at);
grant select, insert, update on public.baka_inbox_items to authenticated;
alter table public.baka_inbox_items enable row level security;
drop policy if exists "baka_inbox_items_select" on public.baka_inbox_items;
create policy "baka_inbox_items_select" on public.baka_inbox_items for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_inbox_items_insert" on public.baka_inbox_items;
create policy "baka_inbox_items_insert" on public.baka_inbox_items for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_inbox_items_update" on public.baka_inbox_items;
create policy "baka_inbox_items_update" on public.baka_inbox_items for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_inbox_items_set_updated_at on public.baka_inbox_items;
create trigger baka_inbox_items_set_updated_at before update on public.baka_inbox_items for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_campaigns (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'planning',
  start_date timestamptz,
  end_date timestamptz,
  primary_channel_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted boolean not null default false
);
create index if not exists baka_campaigns_ws_updated_idx on public.baka_campaigns (workspace_id, updated_at);
grant select, insert, update on public.baka_campaigns to authenticated;
alter table public.baka_campaigns enable row level security;
drop policy if exists "baka_campaigns_select" on public.baka_campaigns;
create policy "baka_campaigns_select" on public.baka_campaigns for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_campaigns_insert" on public.baka_campaigns;
create policy "baka_campaigns_insert" on public.baka_campaigns for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_campaigns_update" on public.baka_campaigns;
create policy "baka_campaigns_update" on public.baka_campaigns for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_campaigns_set_updated_at on public.baka_campaigns;
create trigger baka_campaigns_set_updated_at before update on public.baka_campaigns for each row execute function public.baka_set_updated_at();


create table if not exists public.baka_campaign_items (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  campaign_id uuid not null references public.baka_campaigns (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create index if not exists baka_campaign_items_ws_updated_idx on public.baka_campaign_items (workspace_id, updated_at);
grant select, insert, update on public.baka_campaign_items to authenticated;
alter table public.baka_campaign_items enable row level security;
drop policy if exists "baka_campaign_items_select" on public.baka_campaign_items;
create policy "baka_campaign_items_select" on public.baka_campaign_items for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_campaign_items_insert" on public.baka_campaign_items;
create policy "baka_campaign_items_insert" on public.baka_campaign_items for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_campaign_items_update" on public.baka_campaign_items;
create policy "baka_campaign_items_update" on public.baka_campaign_items for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_campaign_items_set_updated_at on public.baka_campaign_items;
create trigger baka_campaign_items_set_updated_at before update on public.baka_campaign_items for each row execute function public.baka_set_updated_at();


-- Só as conexões curadas manualmente (strategic/custom) são sincronizadas.
-- sharedProject/sharedCampaign são recalculadas localmente em cada
-- dispositivo a partir de baka_project_channels/baka_campaign_items (uma
-- função determinística dos dados já sincronizados), então não faz sentido
-- replicá-las — cada dispositivo já convergiu para o mesmo resultado assim
-- que os dados-fonte convergem.
create table if not exists public.baka_channel_relations (
  id uuid primary key,
  workspace_id uuid not null references public.baka_workspaces (id) on delete cascade,
  source_channel_id uuid not null references public.baka_channels (id) on delete cascade,
  target_channel_id uuid not null references public.baka_channels (id) on delete cascade,
  type text not null default 'strategic',
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  constraint baka_channel_relations_type_synced check (type in ('strategic', 'custom'))
);
create index if not exists baka_channel_relations_ws_updated_idx on public.baka_channel_relations (workspace_id, updated_at);
grant select, insert, update on public.baka_channel_relations to authenticated;
alter table public.baka_channel_relations enable row level security;
drop policy if exists "baka_channel_relations_select" on public.baka_channel_relations;
create policy "baka_channel_relations_select" on public.baka_channel_relations for select using (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_channel_relations_insert" on public.baka_channel_relations;
create policy "baka_channel_relations_insert" on public.baka_channel_relations for insert with check (public.is_baka_workspace_member(workspace_id));
drop policy if exists "baka_channel_relations_update" on public.baka_channel_relations;
create policy "baka_channel_relations_update" on public.baka_channel_relations for update using (public.is_baka_workspace_member(workspace_id)) with check (public.is_baka_workspace_member(workspace_id));
drop trigger if exists baka_channel_relations_set_updated_at on public.baka_channel_relations;
create trigger baka_channel_relations_set_updated_at before update on public.baka_channel_relations for each row execute function public.baka_set_updated_at();
