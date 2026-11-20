import {robot, pupil, pixelIcon as icon} from './pixel-art.js';
import {enterClassroom} from './classroom-arrival.js';
import {liveCall, login, logout, hasTeacherSession, configured, isDemo} from './api.js';
import {choices, escapeHtml as esc} from './domain.js';
import './teacher.css';
import {bindTeacherMenuKey} from './teacher-menu-key.js';

export async function startTeacher({app, homeUrl}) {
  document.body.classList.add('teacher-console');
  let current=null, poll=null, busy=false, refreshing=false, page=0, seen=new Set(), active=null;
  const $=selector=>app.querySelector(selector);
  const size=()=>window.innerWidth>=900?15:6;
  let arrivals=[];
  const clearArrivals=()=>{arrivals.forEach(cancel=>cancel());arrivals=[];};
  const stop=()=>{clearInterval(poll);poll=null;clearArrivals();};
  window.addEventListener('pagehide',stop,{once:true});
  const demoLabel=isDemo?'<span class="teacher-demo">연습 모드 · 이 브라우저에서만 연결</span>':'';
  const message=text=>{const el=$('#teacher-message');if(el)el.textContent=text;};
  function shell(content,back=false,board=false){
    stop();app.innerHTML=`<div class="teacher-app"><div class="teacher-top"><a href="${homeUrl}" class="teacher-brand">${robot()}<span>픽셀 클래스룸</span></a>${demoLabel}${board?'':`<div>${back?'<button id="teacher-dashboard">대시보드</button>':''}<button id="teacher-logout">로그아웃</button></div>`}</div>${content}<p id="teacher-message" role="status"></p></div>`;
    $('#teacher-logout').onclick=()=>run(async()=>{await logout();stop();location.href=homeUrl;});
    if(back)$('#teacher-dashboard').onclick=()=>run(dashboard);
  }
  async function run(fn,button){if(busy)return;busy=true;if(button)button.disabled=true;message('');try{await fn();}catch(error){message(error.message||'연결을 확인하고 다시 시도해 주세요.');}finally{busy=false;if(button?.isConnected)button.disabled=false;if(current?.status==='ended')paint();}}
  function loginPage(error='') {
    stop();app.innerHTML=`<div class="teacher-login"><a class="text-link" href="${homeUrl}">${icon('previous')} 활동 홈</a><span class="teacher-eyebrow">PIXEL CLASSROOM</span><h1>교사 로그인</h1><p>교실의 생각을 한자리에 모아요.</p><form id="teacher-login"><label for="teacher-email">이메일</label><input id="teacher-email" type="email" autocomplete="username" required><label for="teacher-password">비밀번호</label><input id="teacher-password" type="password" autocomplete="current-password" required><button class="btn primary full" ${!configured&&!isDemo?'disabled':''}>로그인</button></form><p id="teacher-message" role="status">${esc(error||(!configured&&!isDemo?'수업 서버 연결을 확인해 주세요.':''))}</p></div>`;
    $('#teacher-login').onsubmit=e=>{e.preventDefault();run(async()=>{await login($('#teacher-email').value,$('#teacher-password').value);try{await dashboard();}catch(error){await logout();throw error;}},e.submitter);};
  }
  async function dashboard(){
    const session=await liveCall('teacher_session');active=session.active;current=null;
    const u=new URL(location.href);u.searchParams.delete('room');u.searchParams.delete('activity');history.replaceState(null,'',u);
    shell(`<section class="teacher-dashboard"><span class="teacher-eyebrow">TEACHER DASHBOARD</span><h1>오늘의 교실</h1><p>활동을 선택하고 학생들의 생각을 만나세요.</p><div class="teacher-summary"><span>진행 중인 활동</span><strong>${active?'트롤리 딜레마':'아직 없어요'}</strong>${active?`<button class="btn primary" id="resume-class">교실 이어보기 ${icon('next')}</button>`:''}</div><button class="btn primary" id="choose-activity">활동 선택 ${icon('next')}</button></section>`);
    $('#choose-activity').onclick=activityPicker;
    if(active)$('#resume-class').onclick=e=>run(()=>openBoard(active.code),e.currentTarget);
  }
  function activityPicker(){
    shell(`<section class="teacher-dashboard"><span class="teacher-eyebrow">활동 선택</span><h1>어떤 생각을 모을까요?</h1><div class="teacher-activities"><article><img src="${import.meta.env.BASE_URL}trolley-preview.svg" alt="기차와 갈림길"><h2>트롤리 딜레마</h2><p>이름·선택·의견이 책상과 말풍선으로 도착해요.</p><label for="class-size">책상 수</label><select id="class-size">${[15,20,25,30].map(n=>`<option value="${n}">${n}석</option>`).join('')}</select><button class="btn primary full" id="start-class">${active?'진행 중인 교실 열기':'교실 열기'} ${icon('next')}</button></article><article class="teacher-cyber"><div class="teacher-chat-art" aria-hidden="true">···</div><h2>사이버폭력 예방</h2><p>학생이 혼자 선택하고 돌아보는 활동이에요. 개인 결과를 수집하지 않아요.</p><a class="btn quiet full" href="${import.meta.env.BASE_URL}cyber/">활동 화면 열기 ${icon('switch')}</a></article><article class="teacher-detective"><img src="${import.meta.env.BASE_URL}detective/preview.svg" alt="픽셀 탐정과 사건 보드"><h2>사이버폭력 탐정단</h2><p>단서를 찾고 댓글을 바꾸는 개인 활동이에요. 약 20~25분, 개인 기록은 수집하지 않아요.</p><a class="btn quiet full" href="${import.meta.env.BASE_URL}detective/">활동 화면 열기 ${icon('switch')}</a></article></div></section>`,true);
    $('#start-class').onclick=e=>run(async()=>{const room=await liveCall('start',{expected:Number($('#class-size').value)});await openBoard(room.code);},e.currentTarget);
  }
  async function openBoard(code){
    current=await liveCall('teacher_get',{code});seen=new Set();page=0;
    const u=new URL(location.href);u.searchParams.set('room',code);history.replaceState(null,'',u);
    shell(`<section class="classroom-stage"><div class="classroom-board"><div><span class="teacher-eyebrow">우리 반 생각 교실</span><h1>트롤리 딜레마</h1></div><div class="class-total"><strong id="class-count">0</strong><span id="class-expected"></span></div></div><div class="desk-grid" id="desk-grid" aria-label="학생 응답 책상"></div><nav class="classroom-bottom" id="desk-pagination" aria-label="책상 페이지" hidden><button id="desk-prev" aria-label="이전 책상">${icon('previous')}</button><span id="desk-page"></span><button id="desk-next" aria-label="다음 책상">${icon('next')}</button></nav></section>
    <dialog class="desk-dialog" id="desk-dialog" aria-labelledby="desk-dialog-title"><form method="dialog"><button aria-label="의견 닫기">${icon('close')}</button></form><div id="desk-detail"></div></dialog>
    <dialog class="teacher-controls-dialog" id="teacher-controls" aria-labelledby="teacher-controls-title"><form method="dialog"><button aria-label="교사 메뉴 닫기">${icon('close')}</button></form><h2 id="teacher-controls-title">교사 메뉴</h2><div class="teacher-controls-grid"><button id="class-toggle"></button><button id="class-fullscreen">${icon('fullscreen')}전체 화면</button><button id="class-finish">활동 종료</button><button id="teacher-dashboard">대시보드</button><button id="teacher-logout">로그아웃</button>${isDemo?'<button id="class-seed">예시 학생 입장</button>':''}</div></dialog>`,true,true);
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
    const answers=current.answers||[],capacity=size(),total=Math.max(current.expected,current.count,...answers.map(a=>a.seat)),pages=Math.ceil(total/capacity);
    const newAnswers=answers.filter(a=>!seen.has(a.seat));
    if(newAnswers.length){const last=newAnswers.at(-1);const nextPage=Math.floor((last.seat-1)/capacity);if(nextPage!==page){page=nextPage;rebuild=true;}}
    page=Math.max(0,Math.min(page,pages-1));
    const start=page*capacity,end=Math.min(total,start+capacity),grid=$('#desk-grid');
    if(rebuild||grid.dataset.range!==`${start}-${end}`){clearArrivals();grid.innerHTML=Array.from({length:end-start},(_,i)=>`<div class="desk-slot" data-seat="${start+i+1}"><div class="desk-top"></div><div class="desk-legs"></div><span class="desk-name" aria-hidden="true"></span></div>`).join('');grid.dataset.range=`${start}-${end}`;}
    for(const answer of answers){
      const slot=grid.querySelector(`[data-seat="${answer.seat}"]`);if(!slot||slot.dataset.filled)continue;
      const c=choices.find(c=>c.id===answer.choice),arrival=!seen.has(answer.seat);
      slot.dataset.filled='true';slot.classList.add('occupied',c.color);
      slot.innerHTML=`<button class="opinion-bubble" aria-label="${esc(answer.name)} 학생의 생각 보기"><span class="opinion-choice">${icon(c.id)} ${c.label}</span><span class="opinion-body"><span class="opinion-text">${esc(answer.reason)}</span></span></button><div class="pupil-seat">${pupil(answer.seat)}</div><div class="desk-top"></div><div class="desk-legs"></div><span class="desk-name">${esc(answer.name)}</span>`;
      if(arrival)arrivals.push(enterClassroom(grid,slot,answer.seat));
      slot.querySelector('button').onclick=()=>{$('#desk-detail').innerHTML=`<h2 id="desk-dialog-title">${esc(answer.name)} 학생의 생각</h2><p class="detail-choice ${c.color}">${icon(c.id)} ${c.label}</p><p>${esc(answer.reason)}</p>`;$('#desk-dialog').showModal();};
    }
    answers.forEach(a=>seen.add(a.seat));
    $('#class-count').textContent=current.count;$('#class-expected').textContent=` / ${current.expected}명`;
    $('#class-toggle').textContent=current.status==='open'?'응답 마감':'응답 다시 열기';$('#class-toggle').disabled=current.status==='ended';$('#class-finish').disabled=current.status==='ended';
    if(isDemo)$('#class-seed').disabled=current.status!=='open';
    $('#desk-page').textContent=`${page+1} / ${pages}`;$('#desk-pagination').hidden=pages<=1;$('#desk-prev').hidden=page===0;$('#desk-next').hidden=page>=pages-1;
  }
  async function refresh(){
    if(refreshing||!current)return;refreshing=true;
    try{const code=current.code;const next=await liveCall('teacher_get',{code});if(!current||current.code!==code)return;current=next;paint();message('');}
    catch(error){message(error.message);}
    finally{refreshing=false;}
  }
  const unbindMenu=bindTeacherMenuKey(window,()=>$('#teacher-controls'),()=>Boolean($('#desk-dialog')?.open));
  window.addEventListener('pagehide',unbindMenu,{once:true});
  window.addEventListener('resize',()=>paint(true));
  try{
    if(!await hasTeacherSession()){loginPage();return;}
    await liveCall('teacher_session');
    const code=new URLSearchParams(location.search).get('room');
    if(code)await openBoard(code);else await dashboard();
  }catch(error){loginPage(error.message);}
}
