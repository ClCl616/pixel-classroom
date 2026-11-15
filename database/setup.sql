-- Run once in the new Supabase project's SQL Editor.
-- The only public endpoint is pixel_classroom. Private tables have no API grants.
begin;
create schema if not exists pixel_private;
revoke all on schema pixel_private from public, anon, authenticated;
grant usage on schema pixel_private to authenticated;

create table pixel_private.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table pixel_private.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  expected integer not null check (expected between 1 and 100),
  status text not null default 'waiting' check (status in ('waiting','open','closed','revealed')),
  created_at timestamptz not null default now()
);
create index pixel_rooms_owner_created on pixel_private.rooms(owner_id, created_at desc);
create table pixel_private.responses (
  room_id uuid not null references pixel_private.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice text not null check (choice in ('switch','stay','hold')),
  reason text not null check (char_length(btrim(reason)) between 1 and 120 and reason !~ E'[\\r\\n]'),
  created_at timestamptz not null default now(),
  primary key(room_id,user_id)
);
create index pixel_responses_user on pixel_private.responses(user_id);
alter table pixel_private.teachers enable row level security;
alter table pixel_private.rooms enable row level security;
alter table pixel_private.responses enable row level security;
revoke all on all tables in schema pixel_private from public, anon, authenticated;

-- This deliberately privileged gateway checks auth.uid(), teacher allowlist,
-- room ownership, and lifecycle state before accessing private tables.
create function pixel_private.handle(action text, payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  room pixel_private.rooms;
  response_count integer;
  own_response jsonb;
  answers jsonb;
  desired text;
  reason_text text;
  result jsonb;
begin
  if actor is null then raise exception '먼저 수업에 접속해 주세요.'; end if;
  if action not in ('list','create','teacher_get','get','state','submit') then
    raise exception '지원하지 않는 요청입니다.';
  end if;
  if action in ('list','create','teacher_get','state') and not exists (
    select 1 from pixel_private.teachers where user_id=actor
  ) then raise exception '수업 운영용 교사 계정이 아닙니다.'; end if;

  if action='list' then
    select coalesce(jsonb_agg(to_jsonb(r) - 'owner_id' order by r.created_at desc),'[]'::jsonb)
    into result from (select * from pixel_private.rooms where owner_id=actor order by created_at desc limit 50) r;
    return result;
  end if;
  if action='create' then
    if nullif(btrim(payload->>'title'),'') is null or char_length(payload->>'title')>60 then
      raise exception '수업 이름을 1~60자로 입력해 주세요.';
    end if;
    if (payload->>'expected') is null or (payload->>'expected') !~ '^[0-9]+$' then
      raise exception '참여 예정 인원을 확인해 주세요.';
    end if;
    insert into pixel_private.rooms(owner_id,title,expected)
    values(actor,btrim(payload->>'title'),(payload->>'expected')::integer) returning * into room;
    return to_jsonb(room)-'owner_id';
  end if;

  -- Row locks serialize submissions with closing/reopening. A request that
  -- waits behind close cannot insert after the class has closed.
  if action in ('submit','state') then
    select * into room from pixel_private.rooms where code=upper(btrim(payload->>'code')) for update;
  else
    select * into room from pixel_private.rooms where code=upper(btrim(payload->>'code'));
  end if;
  if room.id is null then raise exception '수업 코드를 확인해 주세요.'; end if;
  if action in ('teacher_get','state') and room.owner_id<>actor then
    raise exception '이 수업을 운영할 권한이 없습니다.';
  end if;
  if action='state' then
    desired:=payload->>'status';
    if desired is null or not (
      (room.status='waiting' and desired='open') or
      (room.status='open' and desired='closed') or
      (room.status='closed' and desired in ('open','revealed')) or
      (room.status='revealed' and desired='open')
    ) then raise exception '현재 수업 상태에서는 사용할 수 없습니다.'; end if;
    update pixel_private.rooms set status=desired where id=room.id returning * into room;
  end if;
  if action='submit' then
    if room.status<>'open' then raise exception '응답 시간이 마감되었거나 아직 시작되지 않았습니다.'; end if;
    if payload->>'choice' is null or payload->>'choice' not in ('switch','stay','hold') then
      raise exception '세 가지 선택지 중 하나를 골라 주세요.';
    end if;
    reason_text:=btrim(payload->>'reason');
    if reason_text is null or char_length(reason_text) not between 1 and 120 or reason_text ~ E'[\\r\\n]' then
      raise exception '이유를 줄바꿈 없이 1~120자 한 문장으로 써 주세요.';
    end if;
    if exists(select 1 from pixel_private.responses where room_id=room.id and user_id=actor) then
      raise exception '이미 제출한 응답이 있습니다.';
    end if;
    if (select count(*) from pixel_private.responses where room_id=room.id)>=100 then
      raise exception '수업의 최대 응답 수에 도달했습니다.';
    end if;
    insert into pixel_private.responses(room_id,user_id,choice,reason)
    values(room.id,actor,payload->>'choice',reason_text);
  end if;
  select count(*) into response_count from pixel_private.responses where room_id=room.id;
  select jsonb_build_object('choice',choice,'reason',reason) into own_response
  from pixel_private.responses where room_id=room.id and user_id=actor;
  if room.status='revealed' then
    select coalesce(jsonb_agg(jsonb_build_object('choice',choice,'reason',reason) order by created_at),'[]'::jsonb)
    into answers from pixel_private.responses where room_id=room.id;
  end if;
  return (to_jsonb(room)-'owner_id') || jsonb_build_object('count',response_count,'own',own_response,'responses',answers);
end;
$$;
revoke all on function pixel_private.handle(text,jsonb) from public,anon,authenticated;
grant execute on function pixel_private.handle(text,jsonb) to authenticated;
create function public.pixel_classroom(action text,payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select pixel_private.handle(action,payload);
$$;
revoke all on function public.pixel_classroom(text,jsonb) from public,anon,authenticated;
grant execute on function public.pixel_classroom(text,jsonb) to authenticated;
commit;
