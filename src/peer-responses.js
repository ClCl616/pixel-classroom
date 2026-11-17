import {choices,escapeHtml as esc} from './domain.js';
import {pupil,pixelIcon} from './pixel-art.js';

export function showPeerResponses({app,loadPeers,ownSeat,onBack}) {
 let room=null,page=0,busy=false,active=true,last='';
 app.innerHTML=`<main class="rail-activity peer-page"><header class="peer-header"><button id="peer-back" aria-label="내 결과로 돌아가기">${pixelIcon('previous')}</button><h1>우리 반 생각 교실</h1></header><p id="peer-status" role="status"></p><section id="peer-grid" class="desk-grid peer-grid" aria-label="친구들의 책상"></section><nav class="peer-pagination" aria-label="책상 페이지"><button id="peer-prev" aria-label="이전 책상">${pixelIcon('previous')}</button><span id="peer-page"></span><button id="peer-next" aria-label="다음 책상">${pixelIcon('next')}</button></nav><dialog id="peer-detail" class="desk-dialog" aria-labelledby="peer-title"><form method="dialog"><button aria-label="의견 닫기">${pixelIcon('close')}</button></form><div id="peer-opinion"></div></dialog></main>`;
 const $=s=>app.querySelector(s);
 function paint(){
  if(!room)return;
  const total=Math.max(room.expected,...room.answers.map(a=>a.seat)),pages=Math.ceil(total/4);
  page=Math.min(page,pages-1);
  $('#peer-grid').innerHTML=Array.from({length:Math.min(4,total-page*4)},(_,i)=>{
   const seat=page*4+i+1,a=room.answers.find(a=>a.seat===seat),c=choices.find(c=>c.id===a?.choice);
   return `<div class="desk-slot ${a?'occupied '+c.color:''}">${a?`<button class="opinion-bubble" data-seat="${seat}" aria-label="${esc(a.name)} 학생의 생각 보기"><span class="opinion-choice">${pixelIcon(c.id)} ${c.label}</span><span class="opinion-text">${esc(a.reason)}</span></button><div class="pupil-seat">${pupil(seat)}</div>`:''}<div class="desk-top"></div><div class="desk-legs"></div><span class="desk-name">${a?esc(a.name)+(seat===ownSeat?' (나)':''):''}</span></div>`;
  }).join('');
  app.querySelectorAll('[data-seat]').forEach(button=>button.onclick=()=>{const a=room.answers.find(a=>a.seat===Number(button.dataset.seat)),c=choices.find(c=>c.id===a.choice);$('#peer-opinion').innerHTML=`<h2 id="peer-title">${esc(a.name)} 학생의 생각</h2><p class="detail-choice ${c.color}">${pixelIcon(c.id)} ${c.label}</p><p>${esc(a.reason)}</p>`;$('#peer-detail').showModal();});
  $('#peer-page').textContent=`${page+1} / ${pages}`;$('#peer-prev').hidden=page===0;$('#peer-next').hidden=page===pages-1;
  $('.peer-pagination').hidden=pages===1;
 }
 async function refresh(){
  if(busy||!active||document.hidden)return;busy=true;
  try{const result=await loadPeers();if(!active)return;room=result;const next=JSON.stringify(result.answers);if(next!==last){last=next;paint();}$('#peer-status').textContent='';}
  catch(error){if(active)$('#peer-status').textContent=error.message||'연결을 다시 확인하고 있어요.';}
  finally{busy=false;}
 }
 const timer=setInterval(refresh,2000);
 const cleanup=()=>{active=false;clearInterval(timer);window.removeEventListener('pagehide',cleanup);};
 window.addEventListener('pagehide',cleanup,{once:true});
 $('#peer-back').onclick=()=>{cleanup();onBack();};
 $('#peer-prev').onclick=()=>{page--;paint();};$('#peer-next').onclick=()=>{page++;paint();};
 refresh();
}
