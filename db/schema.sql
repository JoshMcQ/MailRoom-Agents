-- Mailroom Agents core schema
-- Idempotent definitions for extensions, types, tables, policies, and triggers

-- Extensions ---------------------------------------------------------------
create extension if not exists vector;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists "uuid-ossp";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('admin', 'agent', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'mailbox_provider') then
    create type public.mailbox_provider as enum ('gmail', 'ms365', 'imap', 'mock');
  end if;
  if not exists (select 1 from pg_type where typname = 'thread_status') then
    create type public.thread_status as enum ('open','pending','waiting_on_customer','resolved','closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_direction') then
    create type public.message_direction as enum ('inbound','outbound','internal');
  end if;
  if not exists (select 1 from pg_type where typname = 'action_type') then
    create type public.action_type as enum ('reply','create_ticket','create_issue','log_feedback','create_crm_lead','schedule_meeting','tag','escalate');
  end if;
  if not exists (select 1 from pg_type where typname = 'action_state') then
    create type public.action_state as enum ('proposed','approved','executed','rejected','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'action_actor') then
    create type public.action_actor as enum ('agent','human','system');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type public.approval_status as enum ('pending','approved','rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'knowledge_source_type') then
    create type public.knowledge_source_type as enum ('doc','kb','release_notes','faq','tickets');
  end if;
  if not exists (select 1 from pg_type where typname = 'work_kind') then
    create type public.work_kind as enum ('classify_and_propose','send_action','reindex_kb');
  end if;
end $$;

-- Helper functions --------------------------------------------------------
create or replace function public.in_org(target_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_thread_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.threads
     set last_message_at = coalesce(new.created_at, now()),
         updated_at = now()
   where id = new.thread_id;
  return new;
end;
$$;

-- Tables ------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users_public (
  id uuid primary key,
  email citext not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users_public(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  address citext not null,
  display_name text,
  provider public.mailbox_provider not null default 'mock',
  settings jsonb not null default '{}'::jsonb,
  sending_identity jsonb,
  verified_sending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, address)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes(id) on delete cascade,
  subject text,
  status public.thread_status not null default 'open',
  assignee_user_id uuid references public.users_public(id),
  intent text,
  confidence real,
  last_message_at timestamptz,
  external_thread_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  direction public.message_direction not null,
  sender text,
  recipients jsonb not null default '[]'::jsonb,
  text text,
  html text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  embedding vector(1536)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  type public.action_type not null,
  payload jsonb not null,
  agent_confidence real,
  state public.action_state not null default 'proposed',
  actor public.action_actor not null default 'agent',
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.actions(id) on delete cascade,
  approver_user_id uuid references public.users_public(id),
  status public.approval_status not null default 'pending',
  note text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes(id) on delete cascade,
  spec jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mailbox_id)
);

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type public.knowledge_source_type not null,
  url text,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete set null,
  title text,
  body text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.work_queue (
  id bigserial primary key,
  kind public.work_kind not null,
  payload jsonb not null,
  attempts integer not null default 0,
  run_at timestamptz not null default now(),
  locked_at timestamptz,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  hashed_key text not null,
  scope jsonb not null default '{}'::jsonb,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  secret text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes -----------------------------------------------------------------
create index if not exists threads_mailbox_last_message_idx on public.threads (mailbox_id, last_message_at desc);
create index if not exists messages_thread_created_idx on public.messages (thread_id, created_at);
create index if not exists kb_chunks_embedding_idx on public.kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists messages_embedding_idx on public.messages using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists events_org_created_idx on public.events (org_id, created_at desc);
create index if not exists actions_thread_state_created_idx on public.actions (thread_id, state, created_at);
create index if not exists work_queue_done_run_idx on public.work_queue (done, run_at);
create index if not exists actions_thread_idx on public.actions (thread_id);
create index if not exists approvals_action_idx on public.approvals (action_id);

-- Triggers ----------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_organizations'
  ) then
    create trigger set_updated_at_organizations
      before update on public.organizations
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_users_public'
  ) then
    create trigger set_updated_at_users_public
      before update on public.users_public
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_org_members'
  ) then
    create trigger set_updated_at_org_members
      before update on public.org_members
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_mailboxes'
  ) then
    create trigger set_updated_at_mailboxes
      before update on public.mailboxes
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_threads'
  ) then
    create trigger set_updated_at_threads
      before update on public.threads
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_actions'
  ) then
    create trigger set_updated_at_actions
      before update on public.actions
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_approvals'
  ) then
    create trigger set_updated_at_approvals
      before update on public.approvals
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_policies'
  ) then
    create trigger set_updated_at_policies
      before update on public.policies
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_knowledge_sources'
  ) then
    create trigger set_updated_at_knowledge_sources
      before update on public.knowledge_sources
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_kb_chunks'
  ) then
    create trigger set_updated_at_kb_chunks
      before update on public.kb_chunks
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_work_queue'
  ) then
    create trigger set_updated_at_work_queue
      before update on public.work_queue
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_api_keys'
  ) then
    create trigger set_updated_at_api_keys
      before update on public.api_keys
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_webhook_endpoints'
  ) then
    create trigger set_updated_at_webhook_endpoints
      before update on public.webhook_endpoints
      for each row
      execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'touch_threads_on_message'
  ) then
    create trigger touch_threads_on_message
      after insert on public.messages
      for each row
      execute function public.touch_thread_last_message();
  end if;
end;
$$;

-- Row Level Security ------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.users_public enable row level security;
alter table public.org_members enable row level security;
alter table public.mailboxes enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.actions enable row level security;
alter table public.approvals enable row level security;
alter table public.policies enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.kb_chunks enable row level security;
alter table public.events enable row level security;
alter table public.work_queue enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;

-- Policies: organizations --------------------------------------------------
create policy if not exists organizations_self
  on public.organizations
  for select
  using (exists (
    select 1 from public.org_members om
    where om.org_id = organizations.id
      and om.user_id = auth.uid()
  ) or auth.role() = 'service_role');

create policy if not exists organizations_service_all
  on public.organizations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- users may read their own profile, but modifications via functions
create policy if not exists users_public_self
  on public.users_public
  for select
  using (auth.role() = 'service_role' or auth.uid() = id);

create policy if not exists users_public_service
  on public.users_public
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Org members --------------------------------------------------------------
create policy if not exists org_members_select
  on public.org_members
  for select
  using (auth.role() = 'service_role' or org_id in (
    select om.org_id from public.org_members om where om.user_id = auth.uid()
  ));

create policy if not exists org_members_insert
  on public.org_members
  for insert
  with check (
    auth.role() = 'service_role' or exists (
      select 1
      from public.org_members om
      where om.org_id = org_members.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  );

create policy if not exists org_members_update
  on public.org_members
  for update
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
  with check (auth.role() = 'service_role' or exists (
    select 1 from public.org_members om
    where om.org_id = org_members.org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  ));

create policy if not exists org_members_delete
  on public.org_members
  for delete
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.org_members om
      where om.org_id = org_members.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  );

-- Mailboxes ----------------------------------------------------------------
create policy if not exists mailboxes_select
  on public.mailboxes
  for select
  using (auth.role() = 'service_role' or public.in_org(org_id));

create policy if not exists mailboxes_mod_admin
  on public.mailboxes
  for all
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.org_members om
      where om.org_id = mailboxes.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
  with check (auth.role() = 'service_role' or exists (
    select 1 from public.org_members om
    where om.org_id = mailboxes.org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  ));

-- Threads ------------------------------------------------------------------
create policy if not exists threads_select
  on public.threads
  for select
  using (
    auth.role() = 'service_role' or public.in_org((select org_id from public.mailboxes m where m.id = threads.mailbox_id))
  );

create policy if not exists threads_update
  on public.threads
  for update
  using (
    auth.role() = 'service_role' or public.in_org((select org_id from public.mailboxes m where m.id = threads.mailbox_id))
  )
  with check (auth.role() = 'service_role' or public.in_org((select org_id from public.mailboxes m where m.id = threads.mailbox_id)));

-- Messages -----------------------------------------------------------------
create policy if not exists messages_rw
  on public.messages
  for all
  using (
    auth.role() = 'service_role' or public.in_org((
      select m.org_id from public.threads t
      join public.mailboxes m on m.id = t.mailbox_id
      where t.id = messages.thread_id
    ))
  )
  with check (auth.role() = 'service_role' or public.in_org((
    select m.org_id from public.threads t
    join public.mailboxes m on m.id = t.mailbox_id
    where t.id = messages.thread_id
  )));

-- Actions ------------------------------------------------------------------
create policy if not exists actions_rw
  on public.actions
  for all
  using (
    auth.role() = 'service_role' or public.in_org((
      select m.org_id from public.threads t
      join public.mailboxes m on m.id = t.mailbox_id
      where t.id = actions.thread_id
    ))
  )
  with check (auth.role() = 'service_role' or public.in_org((
    select m.org_id from public.threads t
    join public.mailboxes m on m.id = t.mailbox_id
    where t.id = actions.thread_id
  )));

-- Approvals ----------------------------------------------------------------
create policy if not exists approvals_rw
  on public.approvals
  for all
  using (
    auth.role() = 'service_role' or public.in_org((
      select m.org_id from public.actions a
      join public.threads t on t.id = a.thread_id
      join public.mailboxes m on m.id = t.mailbox_id
      where a.id = approvals.action_id
    ))
  )
  with check (auth.role() = 'service_role' or public.in_org((
    select m.org_id from public.actions a
    join public.threads t on t.id = a.thread_id
    join public.mailboxes m on m.id = t.mailbox_id
    where a.id = approvals.action_id
  )));

-- Policies table -----------------------------------------------------------
create policy if not exists policies_select
  on public.policies
  for select
  using (
    auth.role() = 'service_role' or public.in_org((select m.org_id from public.mailboxes m where m.id = policies.mailbox_id))
  );

create policy if not exists policies_admin_only
  on public.policies
  for all
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.mailboxes m
      join public.org_members om on om.org_id = m.org_id
      where m.id = policies.mailbox_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
  with check (auth.role() = 'service_role' or exists (
    select 1 from public.mailboxes m
    join public.org_members om on om.org_id = m.org_id
    where m.id = policies.mailbox_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  ));

-- Knowledge ----------------------------------------------------------------
create policy if not exists knowledge_sources_rw
  on public.knowledge_sources
  for all
  using (auth.role() = 'service_role' or public.in_org(org_id))
  with check (auth.role() = 'service_role' or public.in_org(org_id));

create policy if not exists kb_chunks_rw
  on public.kb_chunks
  for all
  using (auth.role() = 'service_role' or public.in_org(org_id))
  with check (auth.role() = 'service_role' or public.in_org(org_id));

-- Events -------------------------------------------------------------------
create policy if not exists events_select
  on public.events
  for select
  using (auth.role() = 'service_role' or public.in_org(org_id));

create policy if not exists events_insert
  on public.events
  for insert
  with check (auth.role() = 'service_role' or public.in_org(org_id));

-- Work Queue ---------------------------------------------------------------
create policy if not exists work_queue_internal
  on public.work_queue
  for select using (false);

create policy if not exists work_queue_service
  on public.work_queue
  for all using (auth.role() = 'service_role');

-- API Keys -----------------------------------------------------------------
create policy if not exists api_keys_admin
  on public.api_keys
  for all
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.org_members om
      where om.org_id = api_keys.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
  with check (auth.role() = 'service_role' or exists (
    select 1 from public.org_members om
    where om.org_id = api_keys.org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  ));

-- Webhook Endpoints --------------------------------------------------------
create policy if not exists webhook_endpoints_admin
  on public.webhook_endpoints
  for all
  using (
    auth.role() = 'service_role' or exists (
      select 1 from public.org_members om
      where om.org_id = webhook_endpoints.org_id
        and om.user_id = auth.uid()
        and om.role = 'admin'
    )
  )
  with check (auth.role() = 'service_role' or exists (
    select 1 from public.org_members om
    where om.org_id = webhook_endpoints.org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
  ));

-- Users may view their org members by join to org_members
