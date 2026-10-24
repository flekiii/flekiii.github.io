-- Fleki's Wrld social backend for a SEPARATE Supabase project.
-- Apply once in its SQL editor. NEVER apply to XONI Mail or AURVEX ID.
-- Supabase Auth owns credentials and TOTP. No service-role key goes into the browser.
create schema if not exists wrld_private;

create table if not exists public.wrld_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default 'Traveler' check (char_length(display_name) between 1 and 45),
  bio text not null default '' check (char_length(bio) <= 350),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.wrld_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists wrld_blocks_reverse_idx on public.wrld_blocks(blocked_id, blocker_id);

create or replace function wrld_private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.wrld_blocks w
  where (w.blocker_id = a and w.blocked_id = b)
     or (w.blocker_id = b and w.blocked_id = a)
); $$;

create table if not exists public.wrld_friends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create unique index if not exists wrld_friend_unique_pair on public.wrld_friends(
  least(sender_id::text, receiver_id::text), greatest(sender_id::text, receiver_id::text)
);
create index if not exists wrld_friends_receiver_idx on public.wrld_friends(receiver_id, status);

create or replace function wrld_private.is_friend(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
 select 1 from public.wrld_friends f
 where f.status = 'accepted'
 and ((f.sender_id=a and f.receiver_id=b) or (f.sender_id=b and f.receiver_id=a))
); $$;

create table if not exists public.wrld_messages (
  id bigint generated always as identity primary key,
  author_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (recipient_id is null or recipient_id <> author_id)
);
create index if not exists wrld_messages_public_idx on public.wrld_messages(created_at desc) where recipient_id is null;
create index if not exists wrld_messages_sender_idx on public.wrld_messages(author_id, created_at desc);
create index if not exists wrld_messages_recipient_idx on public.wrld_messages(recipient_id, created_at desc) where recipient_id is not null;

create table if not exists public.wrld_pins (
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id bigint not null references public.wrld_messages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, message_id)
);

create table if not exists public.wrld_notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('friend_request', 'friend_accepted', 'direct_message')),
  title text not null check (char_length(title) <= 100),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists wrld_notifications_inbox on public.wrld_notifications(recipient_id, created_at desc);

create or replace function wrld_private.create_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 insert into public.wrld_profiles(user_id,username,display_name)
 values(new.id, 'traveler_' || substring(replace(new.id::text, '-', '') from 1 for 12), 'Traveler')
 on conflict (user_id) do nothing;
 return new;
end $$;
drop trigger if exists wrld_on_auth_signup on auth.users;
create trigger wrld_on_auth_signup after insert on auth.users
for each row execute function wrld_private.create_profile();

create or replace function wrld_private.guard_profile()
returns trigger language plpgsql set search_path = ''
as $$
begin
 if new.user_id is distinct from old.user_id or new.created_at is distinct from old.created_at then
   raise exception 'Profile identity cannot be edited';
 end if;
 new.updated_at = now();
 return new;
end $$;
create trigger wrld_guard_profile before update on public.wrld_profiles
for each row execute function wrld_private.guard_profile();

create or replace function wrld_private.guard_friend()
returns trigger language plpgsql set search_path = ''
as $$
begin
 if new.id is distinct from old.id or new.sender_id is distinct from old.sender_id
 or new.receiver_id is distinct from old.receiver_id or new.created_at is distinct from old.created_at then
   raise exception 'Friend request identity cannot change';
 end if;
 if old.status <> 'pending' or new.status not in ('accepted','declined') then
   raise exception 'Invalid friend request transition';
 end if;
 new.updated_at = now();
 return new;
end $$;
create trigger wrld_guard_friend before update on public.wrld_friends
for each row execute function wrld_private.guard_friend();

create or replace function wrld_private.notify_social()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if tg_table_name = 'wrld_friends' then
   if tg_op = 'INSERT' then
     insert into public.wrld_notifications(recipient_id, actor_id, kind, title)
     values (new.receiver_id, new.sender_id, 'friend_request', 'New friend request');
   elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
     insert into public.wrld_notifications(recipient_id, actor_id, kind, title)
     values (new.sender_id, new.receiver_id, 'friend_accepted', 'Friend request accepted');
   end if;
 elsif tg_table_name = 'wrld_messages' and new.recipient_id is not null then
   insert into public.wrld_notifications(recipient_id, actor_id, kind, title)
   values (new.recipient_id, new.author_id, 'direct_message', 'New direct message');
 end if;
 return new;
end $$;
create trigger wrld_friend_notice after insert or update on public.wrld_friends
for each row execute function wrld_private.notify_social();
create trigger wrld_message_notice after insert on public.wrld_messages
for each row execute function wrld_private.notify_social();

alter table public.wrld_profiles enable row level security;
alter table public.wrld_blocks enable row level security;
alter table public.wrld_friends enable row level security;
alter table public.wrld_messages enable row level security;
alter table public.wrld_pins enable row level security;
alter table public.wrld_notifications enable row level security;

-- Each table is inaccessible to guests. Grant only the required Data API privileges.
revoke all on public.wrld_profiles, public.wrld_blocks, public.wrld_friends,
 public.wrld_messages, public.wrld_pins, public.wrld_notifications from anon;
grant select, update on public.wrld_profiles to authenticated;
grant select, insert, delete on public.wrld_blocks to authenticated;
grant select, insert, update, delete on public.wrld_friends to authenticated;
grant select, insert, delete on public.wrld_messages to authenticated;
grant select, insert, delete on public.wrld_pins to authenticated;
grant select on public.wrld_notifications to authenticated;
grant update(is_read) on public.wrld_notifications to authenticated;
grant usage, select on sequence public.wrld_messages_id_seq to authenticated;
grant usage on schema wrld_private to authenticated;
revoke all on function wrld_private.is_blocked(uuid,uuid),wrld_private.is_friend(uuid,uuid) from public;
grant execute on function wrld_private.is_blocked(uuid,uuid),wrld_private.is_friend(uuid,uuid) to authenticated;

create policy "Members can find profiles" on public.wrld_profiles
for select to authenticated using (true);
create policy "Members update own profile" on public.wrld_profiles
for update to authenticated
using (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2')
with check (user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2');

create policy "See own block list" on public.wrld_blocks
for select to authenticated using (blocker_id = (select auth.uid()));
create policy "Block users" on public.wrld_blocks
for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "Unblock users" on public.wrld_blocks
for delete to authenticated using (blocker_id = (select auth.uid()));

create policy "See own friendships" on public.wrld_friends
for select to authenticated
using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));
create policy "Send requests with 2FA" on public.wrld_friends
for insert to authenticated
with check (sender_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
and status = 'pending' and not wrld_private.is_blocked(sender_id, receiver_id));
create policy "Respond to requests with 2FA" on public.wrld_friends
for update to authenticated
using (receiver_id = (select auth.uid()) and status = 'pending' and (select auth.jwt()->>'aal') = 'aal2')
with check (receiver_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
and not wrld_private.is_blocked(sender_id, receiver_id));
create policy "Remove own friendships" on public.wrld_friends
for delete to authenticated
using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));

create policy "Read public or participating messages" on public.wrld_messages
for select to authenticated
using (
 (recipient_id is null or author_id = (select auth.uid()) or recipient_id = (select auth.uid()))
 and not wrld_private.is_blocked((select auth.uid()),author_id)
 and (recipient_id is null or not wrld_private.is_blocked((select auth.uid()),recipient_id))
);
create policy "Send messages with verified 2FA" on public.wrld_messages
for insert to authenticated
with check (
 author_id = (select auth.uid())
 and (select auth.jwt()->>'aal') = 'aal2'
 and (recipient_id is null or (wrld_private.is_friend(author_id,recipient_id)
 and not wrld_private.is_blocked(author_id,recipient_id)))
);
create policy "Remove own messages" on public.wrld_messages
for delete to authenticated using (author_id = (select auth.uid()));

create policy "Read personal pins" on public.wrld_pins
for select to authenticated using(user_id = (select auth.uid()));
create policy "Pin visible messages with 2FA" on public.wrld_pins
for insert to authenticated with check (
 user_id = (select auth.uid()) and (select auth.jwt()->>'aal') = 'aal2'
 and exists (select 1 from public.wrld_messages m where m.id = message_id)
);
create policy "Remove own pins" on public.wrld_pins
for delete to authenticated using(user_id = (select auth.uid()));

create policy "Read own notifications" on public.wrld_notifications
for select to authenticated using (recipient_id = (select auth.uid()));
create policy "Mark own notifications read" on public.wrld_notifications
for update to authenticated using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

-- Do not expose the privileged helper schema through the Data API.
revoke execute on function wrld_private.create_profile(),wrld_private.guard_profile(),
wrld_private.guard_friend(),wrld_private.notify_social() from public;

-- Enable realtime only for the tables used for live interfaces (if publication exists).
do $$
begin
 if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='wrld_messages') then
   alter publication supabase_realtime add table public.wrld_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='wrld_friends') then
   alter publication supabase_realtime add table public.wrld_friends;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='wrld_notifications') then
   alter publication supabase_realtime add table public.wrld_notifications;
  end if;
 end if;
end $$;

-- Additional abuse protection: message limits are enforced in Postgres, not just the UI.
-- This is a basic 3-second cooldown, not a substitute for moderation and provider rate limits.
create or replace function wrld_private.rate_limit_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists(
    select 1 from public.wrld_messages
    where author_id = new.author_id and created_at > now() - interval '3 seconds'
  ) then
    raise exception 'Please wait 3 seconds before sending another message';
  end if;
  return new;
end $$;
revoke all on function wrld_private.rate_limit_message() from public, anon, authenticated;
create trigger wrld_message_rate_limit before insert on public.wrld_messages
for each row execute function wrld_private.rate_limit_message();
