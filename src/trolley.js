import {choices, escapeHtml as esc, validateResponse} from './domain.js';
import './trolley.css';

const questions = {
  switch: '피해를 입는 사람 수 외에, 결정을 내릴 때 고려할 점은 무엇일까요?',
  stay: '행동하지 않는 선택에도 책임이 있을까요?',
  hold: '판단을 내리려면 어떤 정보나 기준이 더 필요할까요?',
};
const outcomes = {
  switch: '기차가 한 사람이 있는 선로로 향해요. 다섯 명의 위험을 줄이지만, 다른 한 사람이 위험해져요.',
  stay: '기차가 원래 선로로 향해요. 다른 한 사람에게 위험을 옮기지 않지만, 다섯 명이 위험한 상황은 남아요.',
  hold: '판단을 잠시 멈췄어요. 실제 상황에서는 결정을 미루는 동안에도 기차가 움직일 수 있어요.',
};
function landscape(mode) {
  const person=(x,y)=>`<g transform="translate(${x} ${y})"><path fill="#f2c4a5" d="M-4-18h8v8h-8z"/><path fill="#244e45" d="M-6-10H6V2H3v9H0V3H-1v8H-4V2H-6z"/></g>`;
  return `<div class="rail-scene ${mode}" role="img" aria-label="갈라지는 선로: 위쪽에 한 명, 아래쪽에 다섯 명. ${mode==='switch'?'기차가 위쪽 선로로 이동합니다.':mode==='stay'?'기차가 아래쪽 선로로 이동합니다.':mode==='hold'?'판단을 유보한 장면입니다.':'기차가 갈림길에 다가옵니다.'}">
  <svg viewBox="0 0 400 280" shape-rendering="crispEdges" aria-hidden="true">
    <defs><pattern id="grass" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M4 9h4v4H4zM26 26h4v4h-4z" fill="#a8c49a"/></pattern></defs>
    <path fill="#dce8c7" d="M0 0h400v280H0z"/><path fill="url(#grass)" d="M0 0h400v280H0z"/>
    <path fill="#b6cca7" d="M0 0h400v35H0z"/><path fill="#819e79" d="M20 8h20v22H20zM340 2h28v30h-28z"/>
    <path class="rail-bed" d="M-30 146H135L260 83H420M135 146L260 215H420"/>
    <path class="rail-ties" d="M-30 146H135L260 83H420M135 146L260 215H420"/>
    <path class="rail-line" d="M-30 146H135L260 83H420M135 146L260 215H420"/>
    <path class="route route-switch" d="M135 146L260 83H400"/><path class="route route-stay" d="M135 146L260 215H400"/>
    <g class="rail-people">${person(321,70)}${[270,294,318,342,366].map(x=>person(x,202)).join('')}</g>
    <g class="rail-lever" transform="translate(141 175)"><path fill="#244e45" d="M-12 9h24v7h-24z"/><path d="M0 9V-12" stroke="#244e45" stroke-width="5"/><path fill="#d8815b" d="M-5-18H5v9H-5z"/></g>
    <g class="moving-train"><path fill="#173d37" d="M-32-26h57v31h-57zM-25 5h10v7h-10zM10 5h10v7H10z"/><path fill="#df9169" d="M-29-23h51V1h-51zM-20-33H9v10h-29z"/><path fill="#fff4d7" d="M-22-17h10v11h-10zM-6-17H4v11H-6zM10-17h8v11h-8z"/><path class="train-light" fill="#fff2b5" d="M25-14h9v8h-9z"/></g>
  </svg><span class="rail-count count-one">1명</span><span class="rail-count count-five">5명</span><span class="rail-signal">${mode==='hold'?'판단 유보':mode==='switch'?'선로 변경':mode==='stay'?'선로 유지':'브레이크 고장'}</span></div>`;
}

// All choices and writing stay in this page's memory; no class or server is needed.
export function startTrolley({app, homeUrl}) {
  let choice='', reason='';
  document.body.classList.add('trolley-immersed');
  const viewport=window.visualViewport;
  const fit=()=>app.style.setProperty('--activity-height',`${viewport?.height || window.innerHeight}px`);
  fit(); viewport?.addEventListener('resize',fit);
  window.addEventListener('pagehide',()=>{viewport?.removeEventListener('resize',fit);choice='';reason='';},{once:true});
  function show(content, stage) {
    app.innerHTML=`<main class="rail-activity" aria-label="트롤리 딜레마"><div class="rail-progress" aria-label="${stage} / 5 단계">${[1,2,3,4,5].map(i=>`<i class="${i<=stage?'done':''}"></i>`).join('')}</div>${content}</main>`;
    app.querySelector('h1')?.focus({preventScroll:true});
  }
  function intro() {
    show(`${landscape('approach')}<section class="rail-story"><span class="rail-kicker">트롤리 딜레마</span><h1 tabindex="-1">기차가 멈추지 않아요.</h1><p>브레이크가 고장 났어요.<br>앞에는 다섯 명, 다른 선로에는 한 명.<br>당신 앞에는 선로를 바꾸는 레버가 있어요.</p></section><div class="rail-controls"><button class="btn primary full" id="rail-next">갈림길 살펴보기 →</button><a class="rail-home" href="${homeUrl}">활동 나가기</a></div>`,1);
    app.querySelector('#rail-next').onclick=decide;
  }
  function decide() {
    show(`${landscape('waiting')}<section class="rail-story"><h1 tabindex="-1">레버를 움직일까요?</h1><p>멈추거나 다른 길로 피할 수 없어요.<br>나라면 어떤 선택을 할까요?</p></section><div class="rail-options">${choices.map(c=>`<button class="rail-option ${c.color}" data-choice="${c.id}"><span>${c.icon}</span>${c.label}</button>`).join('')}</div>`,2);
    app.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{choice=button.dataset.choice;outcome();});
  }
  function outcome() {
    show(`${landscape(choice)}<section class="rail-story"><span class="rail-kicker">내가 선택한 방향</span><h1 tabindex="-1">${choices.find(c=>c.id===choice).label}</h1><p>${outcomes[choice]}</p></section><div class="rail-controls"><button class="btn primary full" id="rail-next">내 이유 적기 →</button><button class="rail-home" id="rail-back">다시 선택하기</button></div>`,3);
    app.querySelector('#rail-next').onclick=write;
    app.querySelector('#rail-back').onclick=decide;
  }
  function write() {
    show(`<section class="rail-story writing-story"><span class="rail-kicker">${choices.find(c=>c.id===choice).label}</span><h1 tabindex="-1">어떤 기준이<br>중요했나요?</h1><p>그렇게 선택한 이유를 한 문장으로 적어 주세요.</p></section><form id="trolley-response" class="rail-writing"><label for="trolley-reason">나의 이유</label><textarea id="trolley-reason" name="reason" maxlength="120" required rows="3" aria-describedby="trolley-hint trolley-error" placeholder="나는 …이 중요하다고 생각했어요.">${esc(reason)}</textarea><div class="rail-input-note"><span id="trolley-hint">줄바꿈 없이 1~120자</span><span id="trolley-counter">${reason.length} / 120</span></div><p id="trolley-error" class="form-error" role="alert"></p><button class="btn primary full" type="submit">내 생각 돌아보기 →</button><button class="rail-home" type="button" id="rail-back">다시 선택하기</button></form>`,4);
    const input=app.querySelector('#trolley-reason');
    input.oninput=()=>{reason=input.value;app.querySelector('#trolley-counter').textContent=`${reason.length} / 120`;app.querySelector('#trolley-error').textContent='';};
    app.querySelector('#trolley-response').onsubmit=e=>{e.preventDefault();try{reason=validateResponse(choice,input.value);}catch(error){app.querySelector('#trolley-error').textContent=error.message;return;}reflect();};
    app.querySelector('#rail-back').onclick=decide;
  }
  function reflect() {
    show(`<section class="rail-story"><span class="rail-kicker">나의 선택과 이유</span><h1 tabindex="-1">${choices.find(c=>c.id===choice).label}</h1><blockquote class="rail-answer">${esc(reason)}</blockquote><h2>한 걸음 더 생각해 보기</h2><p>${questions[choice]}</p></section><div class="rail-controls"><button class="btn primary full" id="rail-next">다른 관점 만나기 →</button><button class="rail-home" id="rail-edit">이유 다시 쓰기</button></div>`,5);
    app.querySelector('#rail-edit').onclick=write;
    app.querySelector('#rail-next').onclick=finish;
  }
  function finish() {
    show(`<section class="rail-story rail-finish"><div class="pixel-thought" aria-hidden="true">↗ ↑ …</div><h1 tabindex="-1">선택 뒤에는<br>서로 다른 기준이 있어요.</h1><p>피해를 줄이는 것.<br>다른 사람에게 위험을 옮기지 않는 것.<br>충분한 근거를 갖추는 것.</p><p>선택이 다른 친구와<br>서로의 이유를 이야기해 보세요.</p></section><div class="rail-controls"><a class="btn primary full" href="${homeUrl}">활동 마치기</a><button class="rail-home" id="rail-restart">다시 체험하기</button></div>`,5);
    app.querySelector('#rail-restart').onclick=()=>{choice='';reason='';intro();};
  }
  intro();
}
