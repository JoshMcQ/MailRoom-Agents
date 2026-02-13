-- Seed data for Mailroom Agents demo environment
-- Safe to run multiple times thanks to ON CONFLICT guards

with upsert_org as (
  insert into public.organizations (id, name, plan)
  values ('11111111-1111-4111-8111-111111111111', 'Acme Inc', 'growth')
  on conflict (id) do update set name = excluded.name, plan = excluded.plan
  returning id
),
upsert_users as (
  insert into public.users_public (id, email, display_name, avatar_url)
  values
    ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'admin@acme.test', 'Alex Admin', null),
    ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'agent@acme.test', 'Bailey Agent', null)
  on conflict (id) do update set email = excluded.email, display_name = excluded.display_name
  returning id
),
member_admin as (
  insert into public.org_members (org_id, user_id, role)
  select upsert_org.id, 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'admin'
  from upsert_org
  on conflict (org_id, user_id) do update set role = excluded.role
  returning org_id
),
member_agent as (
  insert into public.org_members (org_id, user_id, role)
  select upsert_org.id, 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'agent'
  from upsert_org
  on conflict (org_id, user_id) do update set role = excluded.role
  returning org_id
)
select 1;

-- Mailboxes
insert into public.mailboxes (id, org_id, address, display_name, provider, settings)
values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'support@example.com', 'Support', 'mock', jsonb_build_object('auto_response', false)),
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'hello@example.com', 'Hello', 'mock', jsonb_build_object('auto_response', false)),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'bugs@example.com', 'Bugs', 'mock', jsonb_build_object('auto_response', false)),
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'feedback@example.com', 'Feedback', 'mock', jsonb_build_object('auto_response', false))
on conflict (id) do update set address = excluded.address, display_name = excluded.display_name;

-- Policies stub (will be replaced by policy engine during runtime)
insert into public.policies (id, mailbox_id, spec)
values
  ('66666666-6666-4666-8666-666666666666', '22222222-2222-4222-8222-222222222222', '{"agent": {"tone": "friendly_concise"}}'),
  ('77777777-7777-4777-8777-777777777777', '33333333-3333-4333-8333-333333333333', '{"agent": {"tone": "professional"}}'),
  ('88888888-8888-4888-8888-888888888888', '44444444-4444-4444-8444-444444444444', '{"agent": {"tone": "technical"}}'),
  ('99999999-9999-4999-8999-999999999999', '55555555-5555-4555-8555-555555555555', '{"agent": {"tone": "friendly_concise"}}')
on conflict (mailbox_id) do update set spec = excluded.spec;

-- Sample threads and messages ------------------------------------------------
with support_thread as (
  insert into public.threads (id, mailbox_id, subject, status, assignee_user_id, intent, confidence, last_message_at)
  values ('aaaa1111-aaaa-4aaa-9aaa-aaaabbbbcccc', '22222222-2222-4222-8222-222222222222', 'Need help with onboarding', 'open', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'support', 0.82, now() - interval '20 minutes')
  on conflict (id) do update set subject = excluded.subject, status = excluded.status
  returning id
),
hello_thread as (
  insert into public.threads (id, mailbox_id, subject, status, intent, confidence, last_message_at)
  values ('bbbb2222-bbbb-4bbb-9bbb-bbbbccccdddd', '33333333-3333-4333-8333-333333333333', 'Partnership opportunity', 'pending', 'sales', 0.76, now() - interval '1 hour')
  on conflict (id) do update set subject = excluded.subject
  returning id
)
select 1;

insert into public.messages (id, thread_id, direction, sender, recipients, text, created_at)
values
  ('aaaa2222-aaaa-4aaa-9aaa-aaaabbbbcccc', 'aaaa1111-aaaa-4aaa-9aaa-aaaabbbbcccc', 'inbound', 'customer@example.com', jsonb_build_array('support@example.com'), 'Hi team, I need help setting up the new workspace.', now() - interval '21 minutes'),
  ('aaaa3333-aaaa-4aaa-9aaa-aaaabbbbcccc', 'aaaa1111-aaaa-4aaa-9aaa-aaaabbbbcccc', 'outbound', 'support@example.com', jsonb_build_array('customer@example.com'), 'Thanks for reaching out! We are on it.', now() - interval '15 minutes'),
  ('bbbb3333-bbbb-4bbb-9bbb-bbbbccccdddd', 'bbbb2222-bbbb-4bbb-9bbb-bbbbccccdddd', 'inbound', 'founder@newco.test', jsonb_build_array('hello@example.com'), 'We are interested in a pilot. Can you share pricing?', now() - interval '62 minutes')
 on conflict (id) do update set text = excluded.text;

-- Synthetic traffic to power analytics and retrieval (50 inbound messages)
with synthetic as (
  select gs as idx,
         case when gs % 4 = 0 then 'support'
              when gs % 4 = 1 then 'bug'
              when gs % 4 = 2 then 'feedback'
              else 'sales' end as intent
  from generate_series(1,50) gs
),
thread_payload as (
  select
    uuid_generate_v5('00000000-0000-0000-0000-000000000001'::uuid, 'thread-' || idx) as thread_id,
    case intent
      when 'support' then '22222222-2222-4222-8222-222222222222'
      when 'sales' then '33333333-3333-4333-8333-333333333333'
      when 'bug' then '44444444-4444-4444-8444-444444444444'
      else '55555555-5555-4555-8555-555555555555'
    end as mailbox_id,
    concat(initcap(intent), ' inquiry #', idx) as subject,
    case when intent = 'support' then 'open'
         when intent = 'bug' then 'pending'
         else 'resolved' end::public.thread_status as status,
    case when intent = 'sales' then 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' else 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb' end as assignee_user_id,
    intent,
    round(0.55 + (idx % 20) * 0.02, 2)::real as confidence,
    now() - make_interval(hours => idx)
  from synthetic
),
threads_inserted as (
  insert into public.threads (id, mailbox_id, subject, status, assignee_user_id, intent, confidence, last_message_at)
  select thread_id, mailbox_id, subject, status, assignee_user_id, intent, confidence, last_message_at
  from thread_payload
  on conflict (id) do update set
    subject = excluded.subject,
    status = excluded.status,
    intent = excluded.intent,
    confidence = excluded.confidence,
    last_message_at = excluded.last_message_at
  returning id, intent, subject, last_message_at
),
message_payload as (
  select s.idx,
         tp.thread_id,
         tp.intent,
         tp.mailbox_id,
         tp.last_message_at,
         uuid_generate_v5('00000000-0000-0000-0000-000000000002'::uuid, 'message-' || s.idx) as message_id,
         concat(lower(intent), '_customer_', s.idx, '@example.test') as sender
  from synthetic s
  join thread_payload tp on tp.thread_id = uuid_generate_v5('00000000-0000-0000-0000-000000000001', 'thread-' || s.idx)
)
insert into public.messages (id, thread_id, direction, sender, recipients, text, created_at, attachments, html)
select
  message_id,
  thread_id,
  'inbound',
  sender,
  jsonb_build_array(case intent when 'support' then 'support@example.com' when 'sales' then 'hello@example.com' when 'bug' then 'bugs@example.com' else 'feedback@example.com' end),
  concat('Synthetic ', intent, ' request number ', idx, '. Please follow standard playbook.'),
  coalesce(last_message_at, now()) - interval '5 minutes',
  '[]'::jsonb,
  concat('<p>Synthetic ', intent, ' request number ', idx, '.</p>')
from message_payload
on conflict (id) do nothing;

-- Seed outbound resolutions to support retrieval quality
insert into public.messages (id, thread_id, direction, sender, recipients, text, html, created_at)
select
  uuid_generate_v5('00000000-0000-0000-0000-000000000003'::uuid, 'outbound-' || t.id::text),
  t.id,
  'outbound',
  case when t.intent = 'sales' then 'hello@example.com' else m.address end,
  jsonb_build_array('customer+' || left(t.id::text, 8) || '@example.test'),
  concat('Hi there, thanks for the ', t.intent, ' note. Here is the follow-up and resolution.'),
  concat('<p>Resolution for ', t.subject, '.</p>'),
  coalesce(t.last_message_at, now()) + interval '10 minutes'
from public.threads t
join public.mailboxes m on m.id = t.mailbox_id
where t.status in ('resolved', 'closed')
on conflict (id) do nothing;

-- Demo knowledge sources ---------------------------------------------------
insert into public.knowledge_sources (id, org_id, type, url, meta)
values
  ('11110000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'doc', 'https://docs.acme.test/onboarding', '{"title":"Onboarding Guide"}'),
  ('11110000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'kb', 'https://docs.acme.test/faq', '{"title":"FAQ"}')
on conflict (id) do update set url = excluded.url;

insert into public.kb_chunks (id, org_id, source_id, title, body, metadata)
values
  ('21110000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '11110000-0000-4000-8000-000000000001', 'Workspace setup', 'To onboard a new workspace, invite users, configure integrations, and enable guardrails.', '{"keywords":["onboarding","workspace"]}'),
  ('21110000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '11110000-0000-4000-8000-000000000002', 'Pricing policy', 'Pricing is tailored; agents must never fabricate numbers and should escalate to hello@ owner.', '{"keywords":["pricing"]}')
on conflict (id) do update set body = excluded.body;

-- Events snapshot ----------------------------------------------------------
insert into public.events (id, org_id, type, payload)
values
  ('31110000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'seed_initialized', jsonb_build_object('source', 'seed.sql'))
on conflict (id) do nothing;

-- Example actions ----------------------------------------------------------
insert into public.actions (id, thread_id, type, payload, agent_confidence, state, actor)
values
  ('41110000-0000-4000-8000-000000000001', 'aaaa1111-aaaa-4aaa-9aaa-aaaabbbbcccc', 'reply', jsonb_build_object('draft_text', 'Thanks for reaching out!'), 0.9, 'proposed', 'agent'),
  ('41110000-0000-4000-8000-000000000002', 'bbbb2222-bbbb-4bbb-9bbb-bbbbccccdddd', 'create_crm_lead', jsonb_build_object('title', 'Newco pilot request'), 0.8, 'approved', 'agent')
on conflict (id) do update set state = excluded.state;

insert into public.approvals (id, action_id, approver_user_id, status, note, decided_at)
values
  ('51110000-0000-4000-8000-000000000001', '41110000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', 'approved', 'Looks good', now() - interval '10 minutes')
on conflict (id) do update set status = excluded.status;

-- Queue backfill -----------------------------------------------------------
insert into public.work_queue (id, kind, payload, attempts, run_at, done)
values
  (1001, 'classify_and_propose', jsonb_build_object('thread_id', 'aaaa1111-aaaa-4aaa-9aaa-aaaabbbbcccc'), 0, now(), true),
  (1002, 'send_action', jsonb_build_object('action_id', '41110000-0000-4000-8000-000000000001'), 1, now(), false)
on conflict (id) do update set done = excluded.done;
