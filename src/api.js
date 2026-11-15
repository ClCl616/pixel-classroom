import { createClient } from '@supabase/supabase-js';
import { validateResponse } from './domain.js';
export const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const role = new URLSearchParams(location.search).get('view') === 'teacher' ? 'teacher' : 'student';
const client = configured ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { storageKey: `pixel-ai-${role}` } }) : null;
const demo = new URLSearchParams(location.search).get('demo') === '1';
export const isDemo = demo;
const key = 'pixel-ai-demo-v1';
function load() { return JSON.parse(localStorage.getItem(key) || 'null'); }
function save(value) { localStorage.setItem(key, JSON.stringify(value)); }
let uid = sessionStorage.getItem('pixel-demo-user');
if (!uid) { uid = crypto.randomUUID(); sessionStorage.setItem('pixel-demo-user', uid); }
export async function login(email, password) {
  if (demo) return;
  if (!client) throw new Error('아직 수업 서버가 연결되지 않았습니다.');
  const { error } = await client.auth.signInWithPassword({email, password}); if (error) throw error;
}
export async function hasTeacherSession() {
  if (demo) return true;
  if (!client) return false;
  const {data} = await client.auth.getSession(); return Boolean(data.session && !data.session.user.is_anonymous);
}
export async function logout() { if (client) await client.auth.signOut(); }
export async function call(action, payload = {}) {
  if (demo) return demoCall(action, payload);
  if (!client) throw new Error('수업 서버 연결이 필요합니다. 지금은 둘러보기를 이용해 주세요.');
  const {data: session} = await client.auth.getSession();
  if (!session.session && role === 'student') { const {error} = await client.auth.signInAnonymously(); if (error) { if (error.code === 'anonymous_provider_disabled') throw new Error('아직 익명 참여가 열리지 않았습니다. 선생님께 서버 설정을 확인해 달라고 말씀해 주세요.'); throw error; } }
  const {data, error} = await client.rpc('pixel_classroom', {action, payload});
  if (error) throw error; return data;
}
function demoCall(action, p) {
  let room = load();
  if (action === 'list') return room ? [{...room, responses: undefined}] : [];
  if (action === 'create') { room = {id: crypto.randomUUID(),code:'AI2026',title:p.title,expected:p.expected,status:'waiting',responses:[]}; save(room); return room; }
  if (!room || (p.code && p.code.toUpperCase() !== room.code)) throw new Error('수업 코드를 확인해 주세요.');
  if (action === 'state') {
    const next = {waiting:['open'],open:['closed'],closed:['revealed','open'],revealed:['open']};
    if (!next[room.status].includes(p.status)) throw new Error('현재 상태에서는 사용할 수 없습니다.');
    room.status = p.status; save(room);
  }
  if (action === 'submit') {
    if (room.status !== 'open') throw new Error('응답 시간이 마감되었거나 아직 시작되지 않았습니다.');
    const reason = validateResponse(p.choice,p.reason);
    if (room.responses.some(r=>r.uid===uid)) throw new Error('이미 제출한 응답이 있습니다.');
    room.responses.push({uid,choice:p.choice,reason,created_at:new Date().toISOString()});save(room);
  }
  if (action === 'seed') {
    if (room.status !== 'open') throw new Error('응답을 시작한 뒤 예시를 추가해 주세요.');
    const examples = [['switch','피해를 입는 사람 수를 줄이는 것이 중요하다고 생각합니다.'],['stay','한 사람을 일부러 위험에 빠뜨리면 안 된다고 생각합니다.'],['hold','두 선택 모두 누군가 위험해져서 결정하기 어렵습니다.'],['switch','가능한 한 많은 사람을 보호하고 싶습니다.'],['stay','다른 선로의 사람에게 위험을 옮기는 것은 고민이 됩니다.'],['switch','전체 피해가 적은 방향을 선택하고 싶습니다.']];
    room.responses = [...room.responses.filter(r=>!r.uid.startsWith('sample-')),...examples.map(([choice,reason],i)=>({uid:`sample-${i}`,choice,reason}))]; save(room);
  }
  const own = room.responses.find(r=>r.uid===uid);
  return {...room,count:room.responses.length,own:own||null,responses:room.status === 'revealed' ? room.responses.map(({choice,reason})=>({choice,reason})) : null};
}
