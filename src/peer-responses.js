import {choices,escapeHtml as esc} from './domain.js';
import {pupil,pixelIcon} from './pixel-art.js';

export function showPeerResponses({app,loadPeers,ownSeat,onBack}) {
 let answers=[],filter='all',busy=false,active=true;
 app.innerHTML=`<main class="rail-activity peer-page"><header class="peer-header"><button id="peer-back" aria-label="내 결과로 돌아가기">${pixelIcon('previous')}</button><h1>친구들의 생각</h1><button id="peer-refresh">새로고침</button></header><div class="peer-filters" role="group" aria-label="선택별 보기">${[{id:'all',short:'전체'},...choices].map(c=>`<button data-filter="${c.id}" aria-pressed="${c.id==='all'}">${c.short}</button>`).join('')}</div><p id="peer-status" role="status"></p><section id="peer-list" class="peer-list" aria-label="친구들의 응답" tabindex="0"></section></main>`;
 const $=s=>app.querySelector(s);
 function paint(){
  const shown=answers.filter(a=>a.seat!==ownSeat&&(filter==='all'||a.choice===filter));
  $('#peer-list').innerHTML=shown.length?shown.map(a=>{const c=choices.find(c=>c.id===a.choice);return `<article class="peer-card"><div class="peer-person">${pupil(a.seat)}<h2>${esc(a.name)} 학생의 생각</h2></div><div class="result-choice ${c.color}">${pixelIcon(c.id)}<strong>${c.label}</strong></div><p>${esc(a.reason)}</p></article>`;}).join(''):'<p class="peer-empty">아직 이 선택에 도착한 친구의 생각이 없어요.</p>';
 }
 async function refresh(){
  if(busy)return;busy=true;$('#peer-refresh').disabled=true;$('#peer-status').textContent='생각을 불러오고 있어요.';
  try{const result=await loadPeers();if(!active)return;answers=result.answers||[];paint();$('#peer-status').textContent=`친구 ${answers.filter(a=>a.seat!==ownSeat).length}명의 생각`;}
  catch(error){if(active)$('#peer-status').textContent=error.message||'다시 불러와 주세요.';}
  finally{busy=false;if(active)$('#peer-refresh').disabled=false;}
 }
 $('#peer-back').onclick=()=>{active=false;onBack();};
 $('#peer-refresh').onclick=refresh;
 app.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.filter;app.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));paint();$('#peer-list').scrollTop=0;});
 refresh();
}
