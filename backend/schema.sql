-- Fleki's Wrld social foundation.
-- Run only against a NEW, dedicated Supabase project for Fleki's Wrld.
-- Do not apply to XONI Mail or AURVEX.
-- Security model: authenticated users may read permitted content; AAL2 (verified TOTP)
-- is required by Postgres RLS for messages, friend requests, pins, and profile edits.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z][a-z0-9_]{2,19}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 350),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint not_self_block check (blocker <> blocked)
);

create or replace function private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(
  select 1 from public.blocks
  where (blocker = a and blocked = b) or (blocker = b and blocked = a)
); $$;
revoke all on function private.is_blocked(uuid,uuid) from public, anon;
grant execute on function private.is_blocked(uuid,uuid) to authenticated;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles(id) on delete cascade,
  recipient uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  constraint not_self_friend check (sender <> recipient)
);
create unique index if not exists friend_pairs_unique on public.friend_requests
  (least(sender,recipient), greatest(sender,recipient));
create index if not exists friend_recipient_idx on public.friend_requests(recipient,status);
create index if not exists friend_sender_idx on public.friend_requests(sender,status);

create table if not exists public.global_messages (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists global_messages_recent_idx on public.global_messages(created_at desc);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles(id) on delete cascade,
  recipient uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint not_self_message check (sender <> recipient)
);
create index if not exists direct_sender_recent_idx on public.direct_messages(sender, created_at desc);
create index if not exists direct_recipient_recent_idx on public.direct_messages(recipient, created_at desc);

create table if not exists public.message_pins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.global_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,message_id)
);
create table if not exists public.direct_message_pins (
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_id uuid not null references public.direct_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,message_id)
);
create table if not exists public.pinned_contacts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id,contact_id),
  constraint not_self_pin check (user_id <> contact_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient uuid not null references public.profiles(id) on delete cascade,
  actor uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('friend_request','friend_accepted','direct_message')),
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recent_idx on public.notifications(recipient,created_at desc);

-- Defense in depth, including for Data API exposure.
alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.friend_requests enable row level security;
alter table public.global_messages enable row level security;
alter table public.direct_messages enable row level security;
alter table public.message_pins enable row level security;
alter table public.direct_message_pins enable row level security;
alter table public.pinned_contacts enable row level security;
alter table public.notifications enable row level security;

-- No table writes are possible with the anon key alone.
revoke all on table public.profiles,public.blocks,public.friend_requests,public.global_messages,
  public.direct_messages,public.message_pins,public.direct_message_pins,public.pinned_contacts,
  public.notifications from anon;
revoke all on table public.profiles,public.blocks,public.friend_requests,public.global_messages,
  public.direct_messages,public.message_pins,public.direct_message_pins,public.pinned_contacts,
  public.notifications from authenticated;

grant select on public.profiles,public.blocks,public.friend_requests,public.global_messages,
  public.direct_messages,public.message_pins,public.direct_message_pins,public.pinned_contacts,
  public.notifications to authenticated;
grant insert on public.profiles,public.blocks,public.friend_requests,public.global_messages,
  public.direct_messages,public.message_pins,public.direct_message_pins,public.pinned_contacts to authenticated;
grant update (username,display_name,bio,updated_at) on public.profiles to authenticated;
grant update (status) on public.friend_requests to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant delete on public.blocks,public.friend_requests,public.message_pins,
  public.direct_message_pins,public.pinned_contacts,public.global_messages to authenticated;

-- Profiles can be initialized after signup (AAL1), but editing existing profiles requires AAL2.
create policy "read public member directory" on public.profiles for select to authenticated using (true);
create policy "create own profile" on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy "edit own profile with mfa" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2')
  with check (id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

-- Blocking is intentionally allowed at AAL1 so a user can protect themselves quickly.
create policy "see my blocks" on public.blocks for select to authenticated
  using (blocker = (select auth.uid()));
create policy "block other users" on public.blocks for insert to authenticated
  with check (blocker = (select auth.uid()));
create policy "unblock" on public.blocks for delete to authenticated
  using (blocker = (select auth.uid()));

create policy "see my friendships" on public.friend_requests for select to authenticated
  using (sender = (select auth.uid()) or recipient = (select auth.uid()));
create policy "send friend request with mfa" on public.friend_requests for insert to authenticated
  with check (
    sender = (select auth.uid()) and status = 'pending'
    and (select auth.jwt()->>'aal') = 'aal2'
    and not private.is_blocked(sender,recipient)
  );
create policy "accept received friend request with mfa" on public.friend_requests for update to authenticated
  using (recipient = (select auth.uid()) and status = 'pending'
         and (select auth.jwt()->>'aal') = 'aal2')
  with check (recipient = (select auth.uid()) and status = 'accepted'
              and (select auth.jwt()->>'aal') = 'aal2'
              and not private.is_blocked(sender,recipient));
create policy "cancel request or unfriend" on public.friend_requests for delete to authenticated
  using (sender = (select auth.uid()) or recipient = (select auth.uid()));

create policy "read nonblocked global messages" on public.global_messages for select to authenticated
  using (not private.is_blocked((select auth.uid()),author));
create policy "post with mfa" on public.global_messages for insert to authenticated
  with check (author = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');
create policy "delete own global post" on public.global_messages for delete to authenticated
  using (author = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

create policy "read own nonblocked direct messages" on public.direct_messages for select to authenticated
  using ((sender = (select auth.uid()) or recipient = (select auth.uid()))
         and not private.is_blocked(sender,recipient));
create policy "message accepted friend with mfa" on public.direct_messages for insert to authenticated
  with check (
    sender = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
    and not private.is_blocked(sender,recipient)
    and exists (
      select 1 from public.friend_requests f
      where f.status = 'accepted'
      and ((f.sender = sender and f.recipient = recipient)
           or (f.sender = recipient and f.recipient = sender))
    )
  );

create policy "see my global pins" on public.message_pins for select to authenticated
  using (user_id = (select auth.uid()));
create policy "pin visible global messages with mfa" on public.message_pins for insert to authenticated
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
              and exists (select 1 from public.global_messages m where m.id = message_id));
create policy "unpin my global messages" on public.message_pins for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "see my direct pins" on public.direct_message_pins for select to authenticated
  using (user_id = (select auth.uid()));
create policy "pin visible direct messages with mfa" on public.direct_message_pins for insert to authenticated
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
              and exists (select 1 from public.direct_messages m where m.id = message_id));
create policy "unpin my direct messages" on public.direct_message_pins for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "see my pinned contacts" on public.pinned_contacts for select to authenticated
  using (user_id = (select auth.uid()));
create policy "pin friends with mfa" on public.pinned_contacts for insert to authenticated
  with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
              and not private.is_blocked(user_id,contact_id)
              and exists (select 1 from public.friend_requests f
                where f.status = 'accepted'
                and ((f.sender=user_id and f.recipient=contact_id)
                     or (f.sender=contact_id and f.recipient=user_id))));
create policy "unpin my contacts" on public.pinned_contacts for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "read my notifications" on public.notifications for select to authenticated
  using (recipient = (select auth.uid()));
create policy "mark my notifications read" on public.notifications for update to authenticated
  using (recipient = (select auth.uid()))
  with check (recipient = (select auth.uid()));

-- Block obvious message flooding in the database, not only in JavaScript.
create or replace function private.limit_social_posting()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'global_messages' then
    if exists(select 1 from public.global_messages m where m.author = new.author
              and m.created_at > now() - interval '3 seconds') then
      raise exception 'Please wait a few seconds before sending another message';
    end if;
  elsif tg_table_name = 'direct_messages' then
    if exists(select 1 from public.direct_messages m where m.sender = new.sender
              and m.created_at > now() - interval '2 seconds') then
      raise exception 'Please wait a moment before sending another message';
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.limit_social_posting() from public, anon, authenticated;
create trigger rate_limit_global before insert on public.global_messages
for each row execute function private.limit_social_posting();
create trigger rate_limit_direct before insert on public.direct_messages
for each row execute function private.limit_social_posting();

-- Notifications are created server-side; clients cannot invent notifications for other users.
create or replace function private.social_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'friend_requests' then
    if tg_op = 'INSERT' then
      insert into public.notifications(recipient,actor,kind,related_id)
      values(new.recipient,new.sender,'friend_request',new.id);
    elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
      insert into public.notifications(recipient,actor,kind,related_id)
      values(new.sender,new.recipient,'friend_accepted',new.id);
    end if;
  elsif tg_table_name = 'direct_messages' then
    insert into public.notifications(recipient,actor,kind,related_id)
    values(new.recipient,new.sender,'direct_message',new.id);
  end if;
  return new;
end; $$;
revoke all on function private.social_notify() from public, anon, authenticated;
create trigger notify_friend_created after insert on public.friend_requests
for each row execute function private.social_notify();
create trigger notify_friend_accepted after update of status on public.friend_requests
for each row execute function private.social_notify();
create trigger notify_direct_message after insert on public.direct_messages
for each row execute function private.social_notify();

-- End of social schema. Configure allowed URL, email confirmations and MFA in Auth dashboard.
