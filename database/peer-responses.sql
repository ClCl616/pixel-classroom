-- Same-room participants may read peers after submitting. No table grants change.
begin;
create or replace function pixel_private.handle_live(action text,payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 r pixel_private.live_rooms;
 own_answer jsonb;
 answers jsonb;
 total integer;
 assigned_seat integer;
 student_name text;
 student_reason text;
 desired text;
begin
 if actor is null then raise exception '먼저 로그인하거나 활동에 접속해 주세요.'; end if;
 if action is null or action not in ('teacher_session','start','active','get','peers','teacher_get','submit','state','finish') then raise exception '지원하지 않는 요청입니다.'; end if;
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
   select candidate into assigned_seat
   from generate_series(1,greatest(r.expected,total+1)) as candidate
   where not exists(select 1 from pixel_private.live_answers a where a.room_id=r.id and a.seat=candidate)
   order by random() limit 1;
   insert into pixel_private.live_answers(room_id,user_id,name,choice,reason,seat) values(r.id,actor,student_name,payload->>'choice',student_reason,assigned_seat);
  end if;
 end if;
 select count(*) into total from pixel_private.live_answers where room_id=r.id;
 select jsonb_build_object('name',name,'choice',choice,'reason',reason,'seat',seat) into own_answer from pixel_private.live_answers where room_id=r.id and user_id=actor;
 if action='peers' and own_answer is null then raise exception '응답을 제출한 뒤 친구들의 생각을 볼 수 있어요.'; end if;
 if action in ('teacher_get','start','state','finish','peers') then
  select coalesce(jsonb_agg(jsonb_build_object('name',name,'choice',choice,'reason',reason,'seat',seat) order by created_at,seat),'[]'::jsonb) into answers from pixel_private.live_answers where room_id=r.id;
 end if;
 return jsonb_build_object('code',r.code,'expected',r.expected,'status',r.status,'count',total,'own',own_answer,'answers',answers);
end;
$$;
commit;
