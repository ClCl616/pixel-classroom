const app=document.querySelector('#app');
const info=document.querySelector('#info');
document.querySelector('#about').onclick=()=>info.showModal();
document.querySelector('#close').onclick=()=>info.close();
const steps=[
 {title:'사진이 올라왔다.\n나는 어떻게 반응할까?',skill:'위험 알아차리기',context:'하교 후, 반 친구들의 단톡방. 민서의 허락 없이 사진이 올라왔어요. 당신은 이 대화를 보고 있는 친구입니다.',messages:[['지우','오늘 민서 사진 봤어?'],['photo','허락 없이 공유된 친구 사진'],['도윤','표정 웃기다 ㅋㅋ 다른 방에도 올릴까?']],options:[
 ['웃는 이모티콘을 누른다.','도윤','다들 웃네. 다른 방에도 보내야겠다.','웃는 반응이 조롱에 동의한다는 신호로 읽힐 수 있어요. 사진을 더 퍼뜨리지 않고, 지금이라도 반응을 거두거나 도움을 구할 수 있어요.','확산 위험 다시 살펴보기'],
 ['“허락 없이 올린 사진이잖아. 공유하지 말자.”','지우','그냥 장난인데… 그렇게 싫을까?','문제를 짚고 공유 중단을 요청했어요. 상대가 바로 받아들이지 않을 수도 있어요. 설전을 이어가기보다 다른 지원 방법도 생각해 보세요.','확산 중단 요청하기'],
 ['사진을 전달하지 않고, 잠시 상황을 살핀다.','도윤','답이 없네. 일단 다른 방에도 보낼게.','당신이 반응하지 않았다고 조롱에 동의한 것은 아니에요. 다만 다른 친구들은 불편함을 알아차리지 못할 수 있어요. 공개 발언이 어렵다면 개인 연락이나 어른의 도움도 방법이에요.','안전한 개입 방법 찾기'] ]},
 {title:'민서에게서\n메시지가 왔다.',skill:'친구 지지하기',context:'잠시 후 민서에게 개인 메시지가 왔어요. 앞선 선택과 별개로, 이제 친구에게 어떤 말을 할지 선택합니다.',messages:[['민서','내 사진 단톡방에 올라온 거 봤어.'],['민서','계속 퍼지면 어떡하지… 내일 학교 가기 싫어.']],options:[
 ['“너무 신경 쓰지 마. 다 장난일 거야.”','민서','나는 정말 싫은데… 내가 예민한 건가.','안심시키려던 말이 친구의 불편함을 가볍게 여기는 말로 들릴 수 있어요. 의도를 추측하기보다 “많이 불편했겠다”처럼 감정을 먼저 인정해 보세요.','감정 인정 연습하기'],
 ['“많이 불편했겠다. 네 잘못이 아니야. 어떤 도움이 필요해?”','민서','일단 사진이 더 안 퍼졌으면 좋겠어. 같이 도와줄래?','친구의 감정을 인정하고 원하는 도움을 물었어요. 대신 모든 일을 혼자 해결하겠다고 약속하기보다 함께 할 수 있는 행동을 찾아보세요.','감정과 의사 존중하기'],
 ['“내가 걔들한테 똑같이 해줄게.”','민서','그럼 더 싸우게 될까 봐 무서워.','친구를 지키고 싶어도 보복은 갈등과 피해를 늘릴 수 있어요. 상대를 공격하기보다 공유 중단과 도움 요청에 힘을 보태세요.','보복 대신 지원 선택하기'] ]},
 {title:'사진이 다른 방에도.\n이제 무엇을 할까?',skill:'도움 연결하기',context:'사진이 다른 채팅방에도 공유됐다는 소식을 들었어요. 민서는 상황이 더 커질까 걱정합니다.',messages:[['민서','다른 반 단톡방에도 올라왔대.'],['민서','선생님께 말하면 더 놀릴까 봐 걱정돼.']],options:[
 ['필요한 기록을 보관하고, 민서와 함께 믿을 만한 어른에게 도움을 요청한다.','민서','걱정되는 점까지 전해줘서 고마워. 선생님 뵐 때도 같이 가줄래?','발생 시간과 대화 맥락 등 필요한 기록은 공개하거나 재유포하지 않고 보관해요. 친구의 걱정을 함께 전하며 보호자나 교사에게 안전한 대응을 요청할 수 있어요.','기록 보관과 도움 요청하기'],
 ['상황을 알리려고 사진을 친구에게 전달한다.','민서','도와주려는 건 알지만… 사진이 더 퍼지는 건 싫어.','도움을 구할 때도 사진을 널리 전달하면 피해가 커질 수 있어요. 필요한 내용을 믿을 만한 어른에게 제한적으로 전달하고, 플랫폼 신고 기능도 활용할 수 있어요.','도움 요청과 재유포 구분하기'],
 ['더 보지 않도록 차단만 하고 끝낸다.','민서','네가 차단해도 다른 방에는 사진이 남아 있잖아. 그건 어떡하지?','차단은 불편한 연락을 줄이는 방법이지만 다른 곳의 사진까지 없애지는 못해요. 필요한 기록 보관, 신고, 어른에게 도움 요청을 함께 고려해 보세요.','차단 이후의 대응 연결하기'] ]}
];
let current=0,choices=[],revealed=false;
let pending=[],finishSequence=null,chatItems=[],resultPage=0,practiceText="",followLatest=true;
let groupHistory=[],groupReaction=false,groupRead=false;
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced=motionQuery.matches;
function stopSequence(){pending.forEach(clearTimeout);pending=[];finishSequence=null;const banner=document.querySelector('#incoming-message');if(banner){banner.hidden=true;banner.onclick=null;}}
function focusHeading(){const h=app.querySelector('h1,h2');if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}}
function message(name,text){text=text.replace(/^[“"]|[”"]$/g,'');return name==='system'?`<p class="chat-divider">${text}</p>`:name==='photo'?`<div class="msg photo-message"><small>지우</small><img class="chat-photo" src="minseo-silly.png" width="160" height="160" alt="볼을 부풀리고 장난스러운 표정을 짓는 민서의 픽셀 그림"><div class="photo-reactions" id="photo-reactions" role="status"></div></div>`:`<div class="msg ${name==='나'?'me':''}"><small>${name}</small><div class="bubble">${text}</div></div>`;}
function home(){stopSequence();groupHistory=[];groupReaction=false;groupRead=false;document.body.classList.remove('immersed');app.innerHTML=`<section class="intro-scene"><div class="notification" aria-hidden="true"><span class="notification-icon">▣</span><div><small>2학년 3반 · 새 메시지</small><p>“다른 방에도 올릴까?”</p></div><span class="unread-dot"></span></div><h1>잠깐,<br>보내기 전에.</h1><p class="lead">친구의 사진이 단톡방에 올라왔다.<br>이 대화를 보고 있는 나라면?</p><button class="primary" id="start">대화에 들어가기 →</button></section>`;document.querySelector('#start').onclick=()=>{current=0;choices=[];revealed=false;play();};}
function play(){stopSequence();chatItems=[];groupHistory=[];groupReaction=false;groupRead=false;document.body.classList.add('immersed');const s=steps[current];app.innerHTML=`<section class="experience"><button type="button" id="incoming-message" class="incoming-message" aria-label="민서의 새 메시지 열기" hidden><span class="incoming-avatar">민</span><div><strong>민서</strong><p>내 사진 단톡방에 올라온 거 봤어.</p></div><small>지금</small></button><div class="phone-status" aria-label="휴대폰 상태 표시 디자인"><time>4:12</time><div class="phone-island" aria-hidden="true"></div><div class="phone-indicators" aria-hidden="true"><span class="signal-bars"><i></i><i></i><i></i><i></i></span><svg class="wifi" viewBox="0 0 24 18"><path d="M2 5Q12-3 22 5M6 9Q12 4 18 9M10 13Q12 11 14 13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/></svg><span class="battery"><i></i></span></div></div><div class="conversation-head"><span class="chat-avatar">${current===0?'▦':'민'}</span><div><h2>${current===0?'2학년 3반':'민서'}</h2></div></div><div class="immersive-chat" id="conversation" tabindex="0" role="log" aria-label="채팅" aria-live="polite" aria-relevant="additions"><p class="time-divider">오후 4:12</p></div><div class="typing-row" id="typing" aria-hidden="true"><span></span><span></span><span></span></div><div class="composer" id="composer"></div><button class="text-btn skip" id="skip">대화 바로 보기 ↓</button></section>`;
 followLatest=true;document.querySelector('#conversation').onscroll=e=>{const log=e.target;followLatest=log.scrollHeight-log.scrollTop-log.clientHeight<45;};
 document.body.classList.toggle('still',reduced);focusHeading();
 sequence(s.messages,showChoices);
}
function addMessage(name,text){
 const log=document.querySelector('#conversation');
 if(name==='system'&&text.startsWith('민서')){
  groupHistory=chatItems.map(item=>[...item]);
  document.querySelector('.conversation-head h2').textContent='민서';
  document.querySelector('.chat-avatar').textContent='민';
  document.querySelector('.phone-status time').textContent='4:14';
  chatItems=[];log.innerHTML='<p class="time-divider">오후 4:14</p>';
  log.scrollTop=0;followLatest=true;return;
 }
 chatItems.push([name,text]);log.insertAdjacentHTML('beforeend',message(name,text));followChat();
}
function followChat(){if(!followLatest)return;const log=document.querySelector('#conversation');log.scrollTo({top:log.scrollHeight,behavior:reduced?'instant':'smooth'});}
function sequence(messages,done){stopSequence();let index=0,awaitingTap=false;const typing=document.querySelector('#typing'),skip=document.querySelector('#skip');typing.hidden=false;skip.hidden=false;
 const isRoomSwitch=()=>index<messages.length&&messages[index][0]==='system'&&messages[index][1].startsWith('민서');
 const append=()=>{const [name,text]=messages[index++];addMessage(name,text);};
 const complete=()=>{stopSequence();typing.hidden=true;skip.hidden=true;done();followChat();};
 const showNotification=()=>{
  awaitingTap=true;pending.forEach(clearTimeout);pending=[];typing.hidden=true;skip.hidden=true;
  const banner=document.querySelector('#incoming-message');banner.hidden=false;
  banner.onclick=()=>{if(!awaitingTap)return;awaitingTap=false;banner.onclick=null;banner.hidden=true;append();typing.hidden=false;skip.hidden=false;if(reduced)finishSequence();else pending.push(setTimeout(tick,900));};
 };
 finishSequence=()=>{if(awaitingTap)return;pending.forEach(clearTimeout);pending=[];while(index<messages.length){if(isRoomSwitch()){showNotification();return;}append();}complete();};
 skip.onclick=()=>finishSequence?.();
 const tick=()=>{if(isRoomSwitch()){showNotification();return;}append();if(index===messages.length)complete();else pending.push(setTimeout(tick,2300));};
 if(reduced)finishSequence();else pending.push(setTimeout(tick,900));
}
function choiceText(text){return text.startsWith('“')?text:`(${text})`;}
function showChoices(){const s=steps[current];document.querySelector('#composer').innerHTML=`<p class="choice-prompt">내 행동 선택</p><div class="options">${s.options.map((o,i)=>`<button class="option" style="--order:${i}" data-choice="${i}"><span class="choice-letter" aria-hidden="true">${['A','B','C'][i]}</span><strong>${choiceText(o[0])}</strong></button>`).join('')}</div>`;app.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.choice)));}
function performChoice(index,text,done=()=>{}){
 if(text.startsWith('“')){addMessage('나',text);done();return;}
 if(current===2){runPhoneAction(index,done);return;}
 const log=document.querySelector('#conversation');
 if(current===0&&index===0){
  groupReaction=true;
  document.querySelector('#photo-reactions').innerHTML='<span class="reaction-chip" aria-label="내 웃는 반응 1개">😂 <b>1</b></span>';
  const photo=document.querySelector('.photo-message');
  log.scrollTo({top:Math.max(0,photo.offsetTop-log.offsetTop-16),behavior:reduced?'instant':'smooth'});
  done();return;
 }
 if(current===0&&index===2){
  groupRead=true;
  log.insertAdjacentHTML('beforeend','<div class="read-receipt" role="status">읽음 <span aria-hidden="true">✓✓</span></div>');
 }
 followChat();done();
}
function captureConversation(){
 const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<div class="capture-history"><div class="capture-room">2학년 3반 · 오후 4:12</div>${groupHistory.map(([name,text])=>name==='photo'?`<div class="capture-photo"><small>지우</small><img src="minseo-silly.png" width="88" height="88" alt="단톡방에 공유된 민서 사진">${groupReaction?'<span class="capture-reaction">😂 1</span>':''}</div>`:name==='system'?`<small>${escape(text)}</small>`:`<div class="capture-message ${name==='나'?'capture-me':''}"><small>${escape(name)}</small><p>${escape(text.replace(/^[“"]|[”"]$/g,''))}</p></div>`).join('')}${groupRead?'<div class="capture-read">읽음 ✓✓</div>':''}</div>`;
}
function runPhoneAction(kind,done){
 const preview='<img class="operation-photo" src="minseo-silly.png" width="110" height="110" alt="민서 사진">';
 const reports=['대화랑 사진은 저장했어. 선생님께 네가 더 놀림받을까 걱정한다는 것도 전했어. 같이 말씀드리자.','상황 알리려고 친구들한테 사진 보냈어.','도윤은 차단했어. 이제 걔가 보내는 메시지는 안 보려고.'];
 let selected=new Set(),settled=false;
 const recipients=['서연','하준','유나'];
 const selectedNames=()=>[...selected].map(id=>recipients[Number(id)]);
 document.querySelector('.experience').insertAdjacentHTML('beforeend','<section id="phone-action" class="phone-action" role="dialog" aria-modal="true" aria-label="휴대폰 기능 사용"></section>');
 const cancel=()=>{if(settled)return;settled=true;document.querySelector('#phone-action').remove();choices.splice(current);revealed=false;showChoices();app.querySelector('[data-choice]')?.focus({preventScroll:true});};
 const finish=()=>{if(settled)return;settled=true;if(kind===1)reports[1]=`상황 알리려고 ${selectedNames().join(', ')}한테 사진 보냈어.`;const overlay=document.querySelector('#phone-action');overlay.innerHTML=`<div class="operation-finished"><div class="operation-check">✓</div><h2>${kind===2?'차단됨':'전송됨'}</h2></div>`;const complete=()=>{overlay.remove();addMessage('나',reports[kind]);done();};if(reduced)complete();else pending.push(setTimeout(complete,1100));};
 function screen(stage){
  let title,body,label,go;
  if(kind===0){
   if(stage===0){title='화면 캡처';body=`<div class="capture-preview actual-capture">${captureConversation()}<i class="capture-corner a"></i><i class="capture-corner b"></i></div>`;label='캡처하기';go=()=>screen(1);}
   else if(stage===1){title='캡처 미리보기';body=`<div class="saved-preview actual-capture">${captureConversation()}</div><div class="destination-row"><span>▧</span><div><strong>사진에 저장</strong><small>사진과 대화 · 시간 포함</small></div></div>`;label='저장';go=()=>screen(2);}
   else if(stage===2){title='공유 대상';body='<div class="saved-badge">✓ 캡처 저장됨</div><div class="recipient selected"><span class="contact-icon">선</span><div><strong>담임 선생님</strong><small>도움 요청</small></div><span>✓</span></div>';label='선생님께 메시지 작성';go=()=>screen(3);}
   else{title='담임 선생님';body='<div class="attachment-tag">▧ 캡처 1장</div><div class="outgoing-draft">민서 사진이 허락 없이 공유됐어요. 민서가 더 놀림받을까 걱정하고 있어요. 사진이 더 퍼지지 않도록 도와주세요.</div>';label='보내기';go=finish;}
  }else if(kind===1){
   title=stage===0?'사진 공유':'전송 미리보기';
   if(stage===0){body=`${preview}<div class="recipient-list">${recipients.map((n,i)=>`<button class="recipient" data-person="${i}" aria-pressed="false"><span class="contact-icon">${n[0]}</span><strong>${n}</strong><span class="recipient-check">○</span></button>`).join('')}</div>`;label='선택한 친구에게 전달';go=()=>{if(selected.size)screen(1);};}
   else{body=`<div class="attachment-tag">${selectedNames().join(', ')} · ${selected.size}명에게 사진 보내기</div><div class="photo-send-preview">${preview}</div>`;label='보내기';go=finish;}
  }else{
   if(stage===0){title='도윤';body='<div class="profile-avatar">도</div><h3 class="profile-name">도윤</h3><div class="profile-menu"><span>알림</span><span>켜짐</span></div><div class="profile-menu"><span>사진 · 동영상</span><span>1</span></div>';label='차단';go=()=>screen(1);}
   else{title='도윤을 차단할까요?';body='<div class="block-symbol">⊘</div><p class="operation-description">이 상대의 메시지와 알림을 받지 않습니다.</p><div class="blocked-preview"><span>도윤</span><span class="off-switch"></span></div>';label='차단하기';go=finish;}
  }
  const overlay=document.querySelector('#phone-action');overlay.innerHTML=`<div class="operation-header"><span class="operation-dot"></span><h2 tabindex="-1">${title}</h2></div><div class="operation-content">${body}</div><div class="operation-footer">${kind===1||kind===2?'<button class="secondary" id="operation-cancel">취소</button>':''}<button class="primary" id="operation-next">${label}</button></div>`;
  if(kind===1||kind===2){document.querySelector('#operation-cancel').onclick=cancel;overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();cancel();}};}
  overlay.querySelector('h2').focus({preventScroll:true});
  const next=document.querySelector('#operation-next');next.onclick=go;
  if(kind===1&&stage===0){next.disabled=true;overlay.querySelectorAll('[data-person]').forEach(button=>button.onclick=()=>{const id=button.dataset.person;if(selected.has(id))selected.delete(id);else selected.add(id);button.setAttribute('aria-pressed',String(selected.has(id)));button.querySelector('.recipient-check').textContent=selected.has(id)?'✓':'○';next.disabled=selected.size===0;});}
 }
 screen(0);
}

function choose(index){if(revealed)return;choices[current]=index;revealed=true;const o=steps[current].options[index];document.querySelector('#composer').innerHTML='';followLatest=true;performChoice(index,o[0],()=>{
 const final=current===steps.length-1;
 const incoming=[[o[1],o[2]]];
 if(!final){current++;incoming.push(['system',current===1?'민서 · 개인 메시지':'잠시 후'],...steps[current].messages);}
 sequence(incoming,()=>{if(final){document.querySelector('#composer').innerHTML='<button class="primary next-step" id="next">내 선택 돌아보기 →</button>';document.querySelector('#next').onclick=()=>{resultPage=0;result();window.scrollTo(0,0);focusHeading();};}else{revealed=false;showChoices();}});
 });
}
motionQuery.addEventListener('change',e=>{reduced=e.matches;document.body.classList.toggle('still',reduced);if(reduced&&finishSequence)finishSequence();});
function result(){stopSequence();document.body.classList.add('immersed');const last=resultPage===3;
 const s=steps[resultPage],o=s?.options[choices[resultPage]];
 app.innerHTML=`<section class="experience reflection"><div class="experience-top"><button class="text-btn" id="home">← 처음으로</button><span class="chapter">돌아보기 ${resultPage+1} / 4</span><span class="private-label">나만 보는 결과</span></div><div class="reflection-content">${!last?`<p class="eyebrow">${s.skill}</p><h2>${o[4]}</h2><article class="result-card"><small>내가 고른 행동</small><p><b>${choiceText(o[0])}</b></p><p>${o[3]}</p></article>`:`<p class="eyebrow">다음엔 이렇게 말해볼래요</p><h2>친구에게 건넬 한 문장.</h2><label for="sentence" class="sr-only">친구를 지지하는 문장</label><textarea id="sentence" maxlength="300" rows="3" placeholder="네 잘못이 아니야. 선생님께 같이 말씀드릴까?"></textarea>`}</div><div class="reflection-controls"><button class="secondary" id="result-back" ${resultPage===0?'disabled':''}>← 이전</button><button class="primary" id="result-next">${last?'다시 체험하기':'다음'} →</button></div></section>`;
 document.querySelector('#home').onclick=()=>{choices=[];practiceText='';home();focusHeading();};
 if(last){document.querySelector('#sentence').value=practiceText;document.querySelector('#sentence').oninput=e=>{practiceText=e.target.value;};}
 document.querySelector('#result-back').onclick=()=>{if(resultPage>0){resultPage--;result();focusHeading();}};
 document.querySelector('#result-next').onclick=()=>{if(last){current=0;choices=[];practiceText='';revealed=false;play();}else{resultPage++;result();focusHeading();}};
}

home();
window.addEventListener('pagehide',()=>{stopSequence();choices=[];chatItems=[];practiceText='';current=0;revealed=false;home();});
