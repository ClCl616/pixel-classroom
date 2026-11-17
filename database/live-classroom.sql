-- Additive live-classroom schema. Existing anonymous classroom data is unchanged.
begin;
create table pixel_private.live_rooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
 owner_id uuid not null references auth.users(id) on delete cascade,
 expected integer not null default 15 check(expected between 1 and 100),
 status text not null default 'open' check(status in ('open','closed','ended')),
 created_at timestamptz not null default now()
);
create index live_rooms_owner on pixel_private.live_rooms(owner_id,created_at desc);
create table pixel_private.live_answers (
 room_id uuid not null references pixel_private.live_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 20 and name !~ '[[:cntrl:]]'),
 choice text not null check(choice in ('switch','stay','hold')),
 reason text not null check(char_length(btrim(reason)) between 1 and 120 and reason !~ E'[\\r\\n]'),
 seat integer not null check(seat between 1 and 100),
 created_at timestamptz not null default now(),
 primary key(room_id,user_id), unique(room_id,seat)
);
create index live_answers_user on pixel_private.live_answers(user_id);
create table pixel_private.live_activity (
 activity text primary key check(activity='trolley'),
 room_id uuid not null unique references pixel_private.live_rooms(id) on delete cascade
);
alter table pixel_private.live_rooms enable row level security;
alter table pixel_private.live_answers enable row level security;
alter table pixel_private.live_activity enable row level security;
revoke all on pixel_private.live_rooms,pixel_private.live_answers,pixel_private.live_activity from public,anon,authenticated;

create function pixel_private.handle_live(action text,payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 r pixel_private.live_rooms;
 own_answer jsonb;
 answers jsonb;
 total integer;
 student_name text;
 student_reason text;
 desired text;
begin
 if actor is null then raise exception '먼저 로그인하거나 활동에 접속해 주세요.'; end if;
 if action is null or action not in ('teacher_session','start','active','get','teacher_get','submit','state','finish') then raise exception '지원하지 않는 요청입니다.'; end if;
 if action in ('teacher_session','start','teacher_get','state','finish') and not exists(select 1 from pixel_private.teachers where user_id=actor) then raise exception '수업 운영용 교사 계정이 아닙니다.'; end if;
 if action='teacher_session' then
  select lr.* into r from pixel_private.live_rooms lr join pixel_private.live_activity a on a.room_id=lr.id where a.activity='trolley' and lr.owner_id=actor;
  return jsonb_build_object('active',case when r.id is null then null else jsonb_build_object('code',r.code,'status',r.status,'expected',r.expected) end);
 end if;
 if action='start' then
  lock table pixel_private.live_activity in exclusive mode;
  select lr.* into r from pixel_private.live_rooms lr join pixel_private.live_activity a on a.room_id=lr.id where a.activity='trolley';
  if r.id is not null and r.owner_id<>actor then raise exception '다른 교사가 진행 중인 활동이 있습니다.'; end if;
  if r.id is null then
   if coalesce(payload->>'expected','15') !~ '^[0-9]+$' then raise exception '참여 인원을 확인해 주세요.'; end if;
   insert into pixel_private.live_rooms(owner_id,expected) values(actor,coalesce(payload->>'expected','15')::integer) returning * into r;
   insert into pixel_private.live_activity values('trolley',r.id);
  end if;
 elsif action='active' then
  select lr.* into r from pixel_private.live_rooms lr join pixel_private.live_activity a on a.room_id=lr.id where a.activity='trolley';
  if r.id is null then return null; end if;
 else
  if action='finish' then lock table pixel_private.live_activity in exclusive mode; end if;
  if action in ('submit','state','finish') then
   select * into r from pixel_private.live_rooms where code=payload->>'code' for update;
  else
   select * into r from pixel_private.live_rooms where code=payload->>'code';
  end if;
  if r.id is null then raise exception '활동을 찾을 수 없습니다. 홈에서 다시 참여해 주세요.'; end if;
 end if;
 if action in ('teacher_get','state','finish') and r.owner_id<>actor then raise exception '이 활동을 운영할 권한이 없습니다.'; end if;
 if action='state' then
  desired:=payload->>'status';
  if desired is null or desired not in ('open','closed') or r.status='ended' then raise exception '종료된 활동은 다시 열 수 없습니다.'; end if;
  update pixel_private.live_rooms set status=desired where id=r.id returning * into r;
 end if;
 if action='finish' then
  update pixel_private.live_rooms set status='ended' where id=r.id returning * into r;
  delete from pixel_private.live_activity where room_id=r.id;
 end if;
 if action='submit' then
  if r.status<>'open' or not exists(select 1 from pixel_private.live_activity where room_id=r.id) then raise exception '응답이 마감되었어요. 선생님께 확인해 주세요.'; end if;
  student_name:=btrim(payload->>'name');student_reason:=btrim(payload->>'reason');
  if student_name is null or char_length(student_name) not between 1 and 20 or student_name ~ '[[:cntrl:]]' then raise exception '이름을 줄바꿈 없이 1~20자로 적어 주세요.'; end if;
  if student_reason is null or char_length(student_reason) not between 1 and 120 or student_reason ~ E'[\\r\\n]' then raise exception '의견을 줄바꿈 없이 1~120자로 적어 주세요.'; end if;
  if payload->>'choice' is null or payload->>'choice' not in ('switch','stay','hold') then raise exception '선택을 확인해 주세요.'; end if;
  -- Retrying an identical submission after a lost response is safe.
  if exists(select 1 from pixel_private.live_answers where room_id=r.id and user_id=actor) then
   if not exists(select 1 from pixel_private.live_answers where room_id=r.id and user_id=actor and name=student_name and choice=payload->>'choice' and reason=student_reason) then raise exception '이미 제출한 응답이 있습니다.'; end if;
  else
   select count(*) into total from pixel_private.live_answers where room_id=r.id;
   if total>=100 then raise exception '활동의 최대 응답 수에 도달했습니다.'; end if;
   insert into pixel_private.live_answers(room_id,user_id,name,choice,reason,seat) values(r.id,actor,student_name,payload->>'choice',student_reason,total+1);
  end if;
 end if;
 select count(*) into total from pixel_private.live_answers where room_id=r.id;
 select jsonb_build_object('name',name,'choice',choice,'reason',reason,'seat',seat) into own_answer from pixel_private.live_answers where room_id=r.id and user_id=actor;
 if action in ('teacher_get','start','state','finish') then
  select coalesce(jsonb_agg(jsonb_build_object('name',name,'choice',choice,'reason',reason,'seat',seat) order by seat),'[]'::jsonb) into answers from pixel_private.live_answers where room_id=r.id;
 end if;
 return jsonb_build_object('code',r.code,'expected',r.expected,'status',r.status,'count',total,'own',own_answer,'answers',answers);
end;
$$;
revoke all on function pixel_private.handle_live(text,jsonb) from public,anon,authenticated;
grant execute on function pixel_private.handle_live(text,jsonb) to authenticated;
create function public.pixel_live(action text,payload jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path='' as $$ select pixel_private.handle_live(action,payload); $$;
revoke all on function public.pixel_live(text,jsonb) from public,anon,authenticated;
grant execute on function public.pixel_live(text,jsonb) to authenticated;
commit;
