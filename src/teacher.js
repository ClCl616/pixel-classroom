import {liveCall, login, logout, hasTeacherSession, configured, isDemo} from './api.js';
import {choices, escapeHtml as esc} from './domain.js';
import './teacher.css';

const pupil = seat => `<svg class="pupil" viewBox="0 0 32 40" aria-hidden="true" shape-rendering="crispEdges"><path fill="#173d37" d="M8 2h16v4h4v15H4V6h4z"/><path fill="#edbc96" d="M8 8h16v14H8z"/><path fill="#173d37" d="M10 12h3v3h-3zM19 12h3v3h-3zM13 19h6v2h-6z"/><path fill="${['#88b9a1','#e4a47f','#b2a0ce'][seat%3]}" d="M6 23h20v12H6z"/><path fill="#173d37" d="M10 35h5v5h-5zM18 35h5v5h-5z"/></svg>`;
export async function startTeacher({app, homeUrl}) {
  document.body.classList.add('teacher-console');
  let current=null, poll=null, busy=false, refreshing=false, page=0, seen=new Set(), active=null;
  const $=selector=>app.querySelector(selector);
  const size=()=>window.innerWidth>=900?15:6;
  const stop=()=>{clearInterval(poll);poll=null;};
  window.addEventListener('pagehide',stop,{once:true});
  const demoLabel=isDemo?'<span class="teacher-demo">연습 모드 · 이 브라우저에서만 연결</span>':'';
  const message=text=>{const el=$('#teacher-message');if(el)el.textContent=text;};
  function shell(content,back=false){
    stop();app.innerHTML=`<div class="teacher-app"><div class="teacher-top"><a href="${homeUrl}" class="teacher-brand">▦ 픽셀 클래스룸</a>${demoLabel}<div>${back?'<button id="teacher-dashboard">대시보드</button>':''}<button id="teacher-logout">로그아웃</button></div></div>${content}<p id="teacher-message" role="status"></p></div>`;
    $('#teacher-logout').onclick=()=>run(async()=>{await logout();stop();location.href=homeUrl;});
    if(back)$('#teacher-dashboard').onclick=()=>run(dashboard);
  }
  async function run(fn,button){if(busy)return;busy=true;if(button)button.disabled=true;message('');try{await fn();}catch(error){message(error.message||'연결을 확인하고 다시 시도해 주세요.');}finally{busy=false;if(button?.isConnected)button.disabled=false;if(current?.status==='ended')paint();}}
  function loginPage(error='') {
    stop();app.innerHTML=`<div class="teacher-login"><a class="text-link" href="${homeUrl}">← 활동 홈</a><span class="teacher-eyebrow">PIXEL CLASSROOM</span><h1>교사 로그인</h1><p>교실의 생각을 한자리에 모아요.</p><form id="teacher-login"><label for="teacher-email">이메일</label><input id="teacher-email" type="email" autocomplete="username" required><label for="teacher-password">비밀번호</label><input id="teacher-password" type="password" autocomplete="current-password" required><button class="btn primary full" ${!configured&&!isDemo?'disabled':''}>로그인</button></form><p id="teacher-message" role="status">${esc(error||(!configured&&!isDemo?'수업 서버 연결을 확인해 주세요.':''))}</p></div>`;
    $('#teacher-login').onsubmit=e=>{e.preventDefault();run(async()=>{await login($('#teacher-email').value,$('#teacher-password').value);try{await dashboard();}catch(error){await logout();throw error;}},e.submitter);};
  }
  async function dashboard(){
    const session=await liveCall('teacher_session');active=session.active;current=null;
    const u=new URL(location.href);u.searchParams.delete('room');u.searchParams.delete('activity');history.replaceState(null,'',u);
    shell(`<section class="teacher-dashboard"><span class="teacher-eyebrow">TEACHER DASHBOARD</span><h1>오늘의 교실</h1><p>활동을 선택하고 학생들의 생각을 만나세요.</p><div class="teacher-summary"><span>진행 중인 활동</span><strong>${active?'트롤리 딜레마':'아직 없어요'}</strong>${active?'<button class="btn primary" id="resume-class">교실 이어보기 →</button>':''}</div><button class="btn primary" id="choose-activity">활동 선택 →</button></section>`);
    $('#choose-activity').onclick=activityPicker;
    if(active)$('#resume-class').onclick=e=>run(()=>openBoard(active.code),e.currentTarget);
  }
  function activityPicker(){
    shell(`<section class="teacher-dashboard"><span class="teacher-eyebrow">활동 선택</span><h1>어떤 생각을 모을까요?</h1><div class="teacher-activities"><article><img src="${import.meta.env.BASE_URL}trolley-preview.svg" alt="기차와 갈림길"><h2>트롤리 딜레마</h2><p>이름·선택·의견이 책상과 말풍선으로 도착해요.</p><label for="class-size">책상 수</label><select id="class-size">${[15,20,25,30].map(n=>`<option value="${n}">${n}석</option>`).join('')}</select><button class="btn primary full" id="start-class">${active?'진행 중인 교실 열기':'교실 열기'} →</button></article><article class="teacher-cyber"><div class="teacher-chat-art" aria-hidden="true">···</div><h2>사이버폭력 예방</h2><p>학생이 혼자 선택하고 돌아보는 활동이에요. 개인 결과를 수집하지 않아요.</p><a class="btn quiet full" href="${import.meta.env.BASE_URL}cyber/">활동 화면 열기 ↗</a></article></div></section>`,true);
    $('#start-class').onclick=e=>run(async()=>{const room=await liveCall('start',{expected:Number($('#class-size').value)});await openBoard(room.code);},e.currentTarget);
  }
  async function openBoard(code){
    current=await liveCall('teacher_get',{code});seen=new Set();page=0;
    const u=new URL(location.href);u.searchParams.set('room',code);history.replaceState(null,'',u);
    shell(`<section class="classroom-stage"><div class="classroom-board"><div><span class="teacher-eyebrow">우리 반 생각 교실</span><h1>트롤리 딜레마</h1><p id="class-state"></p></div><div class="class-total"><strong id="class-count">0</strong><span id="class-expected"></span><small id="class-connection">연결됨</small></div></div><div class="classroom-toolbar"><button id="class-toggle"></button><button id="class-fullscreen">전체 화면 ⛶</button><button id="class-finish">활동 종료</button>${isDemo?'<button id="class-seed">예시 학생 입장</button>':''}</div><div class="desk-grid" id="desk-grid" aria-label="학생 응답 책상"></div><div class="classroom-bottom"><span id="class-hint">학생이 홈에서 이름·선택·의견을 제출하면 자리에 앉아요.</span><div><button id="desk-prev" aria-label="이전 책상">←</button><span id="desk-page"></span><button id="desk-next" aria-label="다음 책상">→</button></div></div></section><dialog class="desk-dialog" id="desk-dialog" aria-labelledby="desk-dialog-title"><form method="dialog"><button aria-label="의견 닫기">닫기 ×</button></form><div id="desk-detail"></div></dialog>`,true);
    $('#class-toggle').onclick=e=>run(async()=>{current=await liveCall('state',{code:current.code,status:current.status==='open'?'closed':'open'});paint();},e.currentTarget);
    $('#class-finish').onclick=e=>run(async()=>{current=await liveCall('finish',{code:current.code});paint();stop();},e.currentTarget);
    $('#class-fullscreen').onclick=()=>run(async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();});
    if(isDemo)$('#class-seed').onclick=e=>run(async()=>{await liveCall('seed',{code:current.code});await refresh();},e.currentTarget);
    $('#desk-prev').onclick=()=>{page--;paint(true);};$('#desk-next').onclick=()=>{page++;paint(true);};
    paint(true);
    poll=setInterval(()=>{if(!document.hidden&&!busy)refresh();},2000);
  }
  function paint(rebuild=false){
    if(!current||!$('#desk-grid'))return;
    const answers=current.answers||[],capacity=size(),total=Math.max(current.expected,current.count),pages=Math.ceil(total/capacity);
    const newAnswers=answers.filter(a=>!seen.has(a.seat));
    if(newAnswers.length&&seen.size){const last=newAnswers.at(-1);const nextPage=Math.floor((last.seat-1)/capacity);if(nextPage!==page){page=nextPage;rebuild=true;}}
    page=Math.max(0,Math.min(page,pages-1));
    const start=page*capacity,end=Math.min(total,start+capacity),grid=$('#desk-grid');
    if(rebuild||grid.dataset.range!==`${start}-${end}`){grid.innerHTML=Array.from({length:end-start},(_,i)=>`<div class="desk-slot" data-seat="${start+i+1}"><div class="empty-bubble">생각이 도착할 자리</div><div class="desk-top"></div><div class="desk-legs"></div><span class="desk-name">${start+i+1}</span></div>`).join('');grid.dataset.range=`${start}-${end}`;}
    for(const answer of answers){
      const slot=grid.querySelector(`[data-seat="${answer.seat}"]`);if(!slot||slot.dataset.filled)continue;
      const c=choices.find(c=>c.id===answer.choice),arrival=!seen.has(answer.seat);
      slot.dataset.filled='true';slot.classList.add('occupied',c.color);if(arrival)slot.classList.add('arriving');
      slot.innerHTML=`<button class="opinion-bubble" aria-label="${esc(answer.name)}의 의견 전체 보기"><span class="opinion-choice">${c.icon} ${c.label}</span><span class="opinion-text">${esc(answer.reason)}</span></button><div class="pupil-seat">${pupil(answer.seat)}</div><div class="desk-top"></div><div class="desk-legs"></div><span class="desk-name">${esc(answer.name)}</span>`;
      slot.querySelector('button').onclick=()=>{$('#desk-detail').innerHTML=`<h2 id="desk-dialog-title">${esc(answer.name)}의 생각</h2><p class="detail-choice ${c.color}">${c.icon} ${c.label}</p><p>${esc(answer.reason)}</p>`;$('#desk-dialog').showModal();};
    }
    answers.forEach(a=>seen.add(a.seat));
    $('#class-count').textContent=current.count;$('#class-expected').textContent=` / ${current.expected}명`;
    $('#class-state').textContent=current.status==='open'?'응답 받는 중 · 홈에서 바로 참여하세요':current.status==='closed'?'응답 마감 · 친구들의 생각을 함께 읽어요':'활동 종료 · 응답은 보관되어 있어요';
    $('#class-toggle').textContent=current.status==='open'?'응답 마감':'응답 다시 열기';$('#class-toggle').disabled=current.status==='ended';$('#class-finish').disabled=current.status==='ended';
    if(isDemo)$('#class-seed').disabled=current.status!=='open';
    $('#desk-page').textContent=`${page+1} / ${pages}`;$('#desk-prev').disabled=page===0;$('#desk-next').disabled=page>=pages-1;
    if(newAnswers.length)$('#class-hint').textContent=`${newAnswers.at(-1).name}의 생각이 도착했어요. 말풍선을 누르면 의견 전체를 볼 수 있어요.`;
  }
  async function refresh(){
    if(refreshing||!current)return;refreshing=true;
    try{const code=current.code;const next=await liveCall('teacher_get',{code});if(!current||current.code!==code)return;current=next;paint();if($('#class-connection'))$('#class-connection').textContent='방금 연결됨';}
    catch(error){if($('#class-connection'))$('#class-connection').textContent='연결 재시도 중';message(error.message);}
    finally{refreshing=false;}
  }
  window.addEventListener('resize',()=>paint(true));
  try{
    if(!await hasTeacherSession()){loginPage();return;}
    await liveCall('teacher_session');
    const code=new URLSearchParams(location.search).get('room');
    if(code)await openBoard(code);else await dashboard();
  }catch(error){loginPage(error.message);}
}
