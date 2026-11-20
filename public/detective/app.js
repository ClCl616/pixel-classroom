import {supportCases,supportSteps,supportSelection,chooseSupport,supportReady} from './support.js';
import {messages,reasons,reasonChoices,clueTypes,clueCount,writing,actions,responses,quizzes,newCase,inspect,evidenceReady,writingReady,planReady,escapeHtml as esc} from './data.js';
import {createTypewriter,detectivePortrait,caseBoard,concepts,dialoguePages,evidenceFeed,createTimedCue,stepDialogue,boardPageCount,boardPageFor} from './scenes.js';

const app=document.querySelector('#app'),dialog=document.querySelector('#dialog'),dialogBody=document.querySelector('#dialog-body');
const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),typer=createTypewriter(),touchCue=createTimedCue();
let state=newCase(),activeClue=null,returnFocus=null,pendingClue=null,story=null,leaving=false,speechNext=null,touchGuideShown=false;
const stages=['사건 접수','단서 찾기','단서 정리','댓글 바꾸기','해결 계획','도움 연결','최종 확인','조사 완료'];
const btn=(action,label,disabled=false,kind='primary')=>`<button class="${kind}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
const title=(kicker,heading,description='')=>`<div class="page-heading"><span class="sr-only">${kicker}</span><h1 tabindex="-1">${heading}</h1>${kicker.match(/\d+ \/ \d+/)?.[0]?`<span class="scene-count">${kicker.match(/\d+ \/ \d+/)[0]}</span>`:''}${description?`<p>${description}</p>`:''}</div>`;
const pager=(current,total,back,next)=>`<nav class="scene-pager" aria-label="장면 넘기기">${btn(back,'이전',current===0,'quiet')}<span>${current+1} / ${total}</span>${btn(next,'다음',current===total-1,'quiet')}</nav>`;
function shell(content,footer='',kind=''){
  const previousFeed=app.querySelector('.message-scroll');
  if(previousFeed&&state.stage!==0)state.evidenceScroll[previousFeed.dataset.room]=previousFeed.scrollTop;
  typer.stop();touchCue.stop();speechNext=null;
  app.innerHTML=`<div class="game scene-${kind}"><span class="sr-only">${stages[state.stage]}</span><section class="workspace">${content}</section>${footer?`<footer class="controls">${footer}</footer>`:''}</div>`;
  app.querySelector('h1')?.focus({preventScroll:true});
}
function go(stage){state.stage=stage;render();}
function talk(lines,after){story={lines:dialoguePages(lines),index:0,read:new Set(),after};render();}
function speech(text,speaker='회로 탐정'){
  if(story)return `<div class="speech speech-directional" role="group" aria-label="대사 탐색"><span class="speaker-portrait">${speaker==='회로 탐정'?detectivePortrait:`<span class="avatar">${esc(speaker[0])}</span>`}</span><span class="speech-copy"><small>${esc(speaker)}</small><span class="spoken-line" id="speech-text"><span class="sr-only">${esc(text)}</span><span id="typed-line" aria-hidden="true"></span></span>${state.stage===0&&story.index===0&&!touchGuideShown?'<span class="speech-hint" hidden><span>◂ 왼쪽 · 이전</span><span class="next-hint">오른쪽 · 다음 ▸</span></span>':''}</span><button class="speech-zone speech-left" data-action="speech-prev" aria-label="이전 대사" ${story.index===0?'disabled':''}></button><button class="speech-zone speech-right" data-action="speech-next" aria-label="대사 완성 또는 다음 대사" aria-describedby="speech-text"></button></div>`;
  return `<button type="button" class="speech" data-action="speech-next"><span class="speaker-portrait">${speaker==='회로 탐정'?detectivePortrait:`<span class="avatar">${esc(speaker[0])}</span>`}</span><span class="speech-copy"><small>${esc(speaker)}</small><span class="spoken-line"><span class="sr-only">${esc(text)}</span><span id="typed-line" aria-hidden="true"></span></span><span class="speech-hint">눌러서 대사 완성 <span aria-hidden="true">▾</span></span></span></button>`;
}
function typeLine(text,next,label,instant=false){
  speechNext=next;
  typer.start(text,value=>{const el=document.querySelector('#typed-line');if(el)el.textContent=value;},()=>{
    const hint=app.querySelector(story?'.next-hint':'.speech-hint');if(hint)hint.textContent=`${label} ▸`;
    if(story){story.read.add(story.index);if(state.stage===0&&story.index===0&&!touchGuideShown){touchGuideShown=true;const cue=app.querySelector('.speech-hint');if(cue){app.querySelector('.speech-directional')?.classList.add('teach-touch');touchCue.show(cue);}}}
  },motion.matches||instant);
}
function renderStory(){
  const line=story.lines[story.index],text=typeof line==='string'?line:line.text,speaker=typeof line==='string'?'회로 탐정':line.speaker;
  shell(`${title('DETECTIVE RADIO',speaker==='회로 탐정'?'회로 탐정의 브리핑':'새 메시지 도착')}<div class="story-illustration"><img src="preview.svg" alt="단서를 연결하는 픽셀 탐정의 사건 보드"><span class="radio-light" aria-hidden="true"></span></div>${speech(text,speaker)}<div class="dialogue-tools"><span class="line-count">대화 ${story.index+1} / ${story.lines.length}</span>${btn('skip-story','대사 건너뛰기',false,'text-button')}</div>`,'','story');
  typeLine(text,()=>{
    if(stepDialogue(story,1))render();else endStory();
  },story.index===story.lines.length-1?'오른쪽 · 조사 계속':'오른쪽 · 다음',story.read.has(story.index));
}
function endStory(){const after=story.after;story=null;typer.stop();after();}
function modal(content){typer.finish();returnFocus=document.activeElement;dialogBody.innerHTML=content;dialog.querySelector('form button').textContent='닫기';dialog.showModal();dialog.querySelector('h2')?.focus();}
function reset(){touchGuideShown=false;typer.stop();story=null;pendingClue=null;activeClue=null;state=newCase();render();}

dialog.addEventListener('close',()=>{
  activeClue=null;
  if(pendingClue&&!leaving){state.latest=pendingClue;state.boardPage=boardPageFor(pendingClue);pendingClue=null;state.view='board';render();}
  else if(returnFocus?.isConnected&&!leaving)returnFocus.focus({preventScroll:true});
});
function fileButtons(){return `<div class="file-tabs" role="group" aria-label="사건 파일">${['sns','chat'].map((room,i)=>`<button data-room="${room}" aria-pressed="${state.room===room}">${i===0?'A · SNS':'B · 단톡방'}<small>${state.visited.includes(room)?'열람함':'미열람'}</small></button>`).join('')}</div>`;}
function renderFiles(){
  shell(`${title('CASE FILES','어디부터 살펴볼까?','두 파일에 남겨진 말을 조사해 보세요.')}<div class="file-selection"><button data-room="sns" class="case-folder"><span class="folder-tab">FILE A</span><span class="folder-symbol" aria-hidden="true">#</span><strong>SNS 게시물</strong><span>발표 사진에 달린 댓글</span><small>${state.visited.includes('sns')?'열람함':'새 파일'}</small></button><button data-room="chat" class="case-folder lilac"><span class="folder-tab">FILE B</span><span class="folder-symbol" aria-hidden="true">···</span><strong>반 단톡방</strong><span>연습 시간을 정하던 대화</span><small>${state.visited.includes('chat')?'열람함':'새 파일'}</small></button></div>`,`${btn('board',`사건 보드 · ${state.clues.length}/${clueCount}`,false,'quiet')}${btn('evidence-done','단서 정리',!evidenceReady(state))}`,'files');
}
function renderEvidence(){
  const room=state.room,sns=room==='sns';
  if(!state.visited.includes(room))state.visited.push(room);
  const post=`<article class="social-post"><div class="post-author"><span class="avatar">지</span><span><strong>지안</strong><small>어제 오후 4:10</small></span><span class="post-menu" aria-hidden="true">···</span></div><div class="post-photo" role="img" aria-label="발표를 마친 지안의 가상 게시물 삽화"><span class="photo-board">MY FIRST<br>PRESENTATION</span><span class="photo-person" aria-hidden="true"></span><span class="photo-desk" aria-hidden="true"></span><span class="photo-sticker">발표 끝!</span></div><div class="post-copy"><span class="post-symbols" aria-hidden="true">♡ &nbsp; ▢ &nbsp; ↗</span><p><strong>지안</strong> 오늘 발표 끝! 긴장했지만 끝까지 했다.</p><small>댓글 ${messages.filter(m=>m.room==='sns').length}개 · 댓글을 눌러 조사해요</small></div></article>`;
  shell(`${title('EVIDENCE SEARCH','메시지에서 단서 찾기')}${fileButtons()}<section class="phone-file ${sns?'social-file':'chat-file'}"><div class="feed-toolbar">${sns?'<strong>PIXEL SOCIAL</strong><span>가상 SNS</span>':'<span class="chat-room-icon" aria-hidden="true">···</span><div><strong>3학년 1반 · 발표 준비</strong><small>지안의 화면 · 가상 단톡방</small></div>'}</div><div class="message-scroll" data-room="${room}" tabindex="0" role="region" aria-label="${sns?'SNS 게시물과 댓글':'단톡방 대화'}">${sns?post:'<p class="chat-date">오늘 · 오후 3:30</p>'}<div class="messages">${evidenceFeed(room,state.clues)}</div>${sns?'<p class="feed-end">모든 댓글을 확인했어요.</p>':'<p class="left-room">지안이가 채팅방을 나갔습니다.</p>'}</div></section><p class="scene-tip">아래로 스크롤하며 읽고, 조사할 말을 눌러요.</p>`,`${btn('board',`사건 보드 · ${state.clues.length}/${clueCount}`,false,'quiet')}${btn('evidence-done','단서 정리',!evidenceReady(state))}`,'evidence');
  const feed=app.querySelector('.message-scroll');
  feed.scrollTop=state.evidenceScroll[room];

}
function renderBoard(){
  const m=messages.find(m=>m.id===state.latest);
  const line=m?(evidenceReady(state)?'모든 단서가 연결됐어. 이제 함께 정리해 보자!':`${clueTypes[m.reason]} 단서가 연결됐어. 다른 말도 조사해 보자.`):'단서들이 사건과 연결됐어. 카드를 누르면 다시 읽을 수 있어.';
  shell(`${title(m?'NEW CONNECTION':'EVIDENCE BOARD',m?'새 단서가 연결됐어!':'우리의 사건 보드')}${caseBoard(state.clues,state.latest,state.boardPage)}${pager(state.boardPage,boardPageCount,'board-prev','board-next')}${speech(line)}`,evidenceReady(state)?btn('resume-evidence','파일 다시 보기',false,'text-button'):'','board');
  typeLine(line,()=>{if(evidenceReady(state))summarizeEvidence();else{state.view='evidence';render();}},evidenceReady(state)?'눌러서 단서 정리':'눌러서 조사 계속');state.latest=null;
}
function renderConcept(){const c=concepts[state.concept];
  shell(`${title(`CASE NOTES · ${state.concept+1} / ${concepts.length}`,'단서의 의미를 읽어 보자')}<article class="paper concept-card ${c.color}"><span class="label">${c.tag}</span><h2>${c.name}</h2><p>${c.body}</p><blockquote>${c.example}</blockquote></article>`,`${btn('concept-back',state.concept?'이전':'사건 보드',false,'quiet')}${btn('concept-next',state.concept===concepts.length-1?'댓글 바꾸기':'다음 카드')}`,'concept');
}
function renderWriting(){const i=state.mission,w=writing[i];
  shell(`${title(`REWRITE LAB · ${i+1} / 2`,state.preview?'내 문장 살펴보기':w.title)}<section class="paper writing-paper"><span class="label">원래 메시지</span><blockquote class="original">${w.original}</blockquote>${state.preview?`<div class="rewritten"><span class="avatar">나</span><p>${esc(state.drafts[i])}</p></div><fieldset><legend>내 문장을 직접 확인해요</legend>${['상대를 비웃거나 탓하는 표현은 없나요?','함께 참여하거나 도움받을 수 있는 말인가요?'].map((text,n)=>`<label class="check-row"><input type="checkbox" data-review="${n}" ${state.reviews[i][n]?'checked':''}><span>${text}</span></label>`).join('')}</fieldset>`:`<label for="draft">${w.prompt}</label><textarea id="draft" maxlength="200" rows="3" placeholder="내가 건넬 새로운 말">${esc(state.drafts[i])}</textarea><div class="writing-tools">${btn('hint','말문이 막히면 힌트',false,'text-button')}<span><span id="draft-count">${state.drafts[i].length}</span> / 200</span></div>`}</section>`,state.preview?`${btn('edit','조금 고치기',false,'quiet')}${btn('save-writing','이 문장 남기기',!writingReady(state,i))}`:`${btn('writing-back',i?'첫 번째 문장':'단서 정리',false,'quiet')}${btn('preview','문장 확인',!state.drafts[i].trim())}`,'writing');
}
function renderSupport(){
  const step=supportSteps[state.supportPage],item=supportCases[step.caseIndex],choice=supportSelection(state),words=step.kind==='words';
  const heading=words?'어떤 말을 건넬까?':'어떤 행동으로 도울까?';
  const content=state.supportFeedback&&choice
    ?`<article class="paper support-feedback"><span class="label">${choice.safe?'친구를 돕는 선택':'다시 생각해 보기'}</span><blockquote>${esc(choice.text)}</blockquote><p>${esc(choice.feedback)}</p></article>`
    :`<p class="support-situation">${esc(item.situation)}</p><div class="support-options" role="group" aria-label="${heading}">${item[step.kind].map((option,index)=>`<button data-support-choice="${index}" aria-pressed="${state.supportChoices[state.supportPage]===index}"><span class="option-letter">${'ABC'[index]}</span><span>${esc(option.text)}</span></button>`).join('')}</div>`;
  shell(`${title(`SUPPORT · ${state.supportPage+1} / ${supportSteps.length}`,item.name)}<p class="support-question">${heading} ${btn('support-clue','단서 다시 보기',false,'text-button')}</p>${content}`,
    state.supportFeedback?`${btn('support-retry','다시 고르기',false,'quiet')}${btn('support-next',state.supportPage===supportSteps.length-1?'공통 계획 세우기':words?'행동 고르기':'다음 유형',!choice?.safe)}`:btn('support-back',state.supportPage?'이전 선택':'댓글 보기',false,'quiet'),'support');
}
function supportNote(index){
  const item=supportCases[index];
  return `<h3>${item.name} · 나의 도움</h3>${['words','actions'].map((kind,i)=>{const choice=supportSelection(state,index*2+i);return `<div class="note-entry"><small>${kind==='words'?'건넬 말':'도울 행동'}</small><p>${choice?`${esc(choice.text)}${choice.safe?'':' · 다시 선택해요'}`:'아직 선택 전이에요.'}</p></div>`;}).join('')}`;
}
function renderPlan(){
  if(state.planReview){
    state.planReviewPage=Math.min(state.planReviewPage,Math.max(0,state.plan.length-1));
    const selected=actions.find(a=>a.id===state.plan[state.planReviewPage]);
    shell(`${title('OUR PLAN','우리의 해결 계획')}<div class="plan-review">${selected?`<article class="paper ${selected.safe?'':'unsafe'}"><h2>${selected.title}</h2><p>${selected.detail}</p><button class="text-button" data-remove-plan="${selected.id}" aria-label="${selected.title} 계획에서 빼기">계획에서 빼기</button></article>`:'<p>아직 선택한 행동이 없어요. 카드를 살펴보며 계획을 골라 주세요.</p>'}</div>${state.plan.length?pager(state.planReviewPage,state.plan.length,'review-prev','review-next'):''}<p class="scene-tip" role="status">${planReady(state)?`${state.plan.length}개의 행동을 골랐어요. 친구를 도울 준비가 됐어요.`:state.plan.some(id=>!actions.find(a=>a.id===id)?.safe)?'수정할 행동이 있어요. 선택한 계획을 끝까지 살펴봐요.':'안전한 행동을 두 가지 이상 골라 주세요.'}</p>`,`${btn('plan-cards','카드 다시 보기',false,'quiet')}${btn('plan-done','이 계획으로 돕기',!(planReady(state)&&supportReady(state)))}`,'plan-review');return;
  }
  const a=actions[state.actionPage],selected=state.plan.includes(a.id);
  shell(`${title(`ACTION CARD · ${state.actionPage+1} / ${actions.length}`,'어떤 행동이 도움이 될까?')}<article class="paper action-card ${selected?'selected':''}"><span class="action-number">${String(state.actionPage+1).padStart(2,'0')}</span><h2>${a.title}</h2><button data-plan="${a.id}" class="${selected?'quiet':'primary'}" aria-pressed="${selected}">${selected?'✓ 선택됨 · 계획에서 빼기':'해결 계획에 넣기'}</button><div class="action-explanation" role="status">${selected?`<p class="${a.safe?'':'revise'}">${a.detail}</p>`:'<p class="muted">선택하면 이 행동의 영향을 살펴볼 수 있어요.</p>'}</div></article>${pager(state.actionPage,actions.length,'action-prev','action-next')}`,`${btn('back-support','유형별 도움',false,'quiet')}${btn('plan-review',`내 계획 보기 · ${state.plan.length}개`)}`,'plan');
}
function renderConnection(){
  if(state.response!==null){const r=responses[state.response];
    shell(`${title('FOLLOW-UP',state.response===1?'함께 도움을 요청하자':'다시 생각해 볼까요?')}<section class="paper"><blockquote>${r.text}</blockquote><div class="feedback"><p>${r.feedback}</p></div></section>`,`${btn('response-retry','다른 말 살펴보기',false,'quiet')}${btn('connection-done','대화 이어가기',state.response!==1)}`,'connection');return;
  }
  shell(`${title('FOLLOW-UP','그런데도 계속된다면?')}<div class="private-message"><span class="avatar">지</span><div><strong>지안</strong><p>소문과 사진 걱정이 아직 남아 있어.<br>계속 도움을 받아도 될까?</p></div></div><div class="response-list">${responses.map((r,i)=>`<button data-response="${i}" class="response"><span>${'ABC'[i]}</span>${r.text}</button>`).join('')}</div>`,btn('back-plan','해결 계획 다시 보기',false,'quiet'),'connection');
}
function renderQuiz(){const q=quizzes[state.quiz],answer=state.answers[state.quiz];
  shell(`${title(`FINAL CHECK · ${state.quiz+1} / 3`,'마지막으로 확인해 볼까?')}<section class="quiz-paper"><span class="stamp">CHECK</span><h2>${q.question}</h2>${answer===undefined?`<div class="ox">${[true,false].map(v=>`<button data-answer="${v}" aria-label="${v?'O, 그렇다':'X, 아니다'}">${v?'O':'X'}</button>`).join('')}</div>`:`<div class="feedback" role="status"><strong>${answer===q.answer?'맞아요!':'함께 확인해요.'} 정답은 ${q.answer?'O':'X'}</strong><p>${q.feedback}</p><small>내 선택: ${answer?'O':'X'}</small></div>`}</section>`,btn('quiz-next',state.quiz===2?'사건 수첩 완성':'다음 질문',answer===undefined),'quiz');
}
function noteSection(index,mission=null){
  if(index===0)return `<h3>내가 찾은 문제</h3><p>${state.clues.length?[...new Set(state.clues.map(id=>clueTypes[messages.find(m=>m.id===id).reason]))].join(' · '):'아직 조사 전이에요.'}</p><ul>${state.clues.map(id=>`<li>${esc(messages.find(m=>m.id===id).text)}</li>`).join('')}</ul>`;
  if(index===1)return `<h3>내가 바꾼 문장</h3>${writing.flatMap((w,i)=>mission!==null&&mission!==i?[]:[`<div class="note-entry"><small>${w.title}</small><p>${state.saved[i]?esc(state.drafts[i]):'아직 남긴 문장이 없어요.'}</p></div>`]).join('')}`;
  if(index===2)return `<h3>나의 해결 계획</h3>${state.plan.length?`<ul>${state.plan.map(id=>{const a=actions.find(a=>a.id===id);return `<li>${a.title}${a.safe?'':' · 수정이 필요한 행동'}</li>`;}).join('')}</ul>`:'<p>아직 선택한 행동이 없어요.</p>'}`;
  return `<h3>내가 기억할 한 가지</h3><p>${state.pledge.trim()?esc(state.pledge):'아직 남긴 문장이 없어요.'}</p>`;
}
function notebook(){return [0,1,2].map(i=>`<section class="notebook-section">${noteSection(i)}</section>`).join('')+supportCases.map((_,i)=>`<section class="notebook-section">${supportNote(i)}</section>`).join('')+noteSection(3);}
function renderReport(){const last=state.reportPage===4+supportCases.length;
  shell(`${title(`CASE REPORT · ${state.reportPage+1} / ${5+supportCases.length}`,last?'내가 기억할 한 가지':'탐정단 조사 완료')}<article class="report-paper"><div class="report-header"><span>나의 사건 수첩</span><span class="stamp">조사 완료</span></div>${last?`<label for="pledge">온라인에서 누군가 상처받고 있다면, 나는…</label><textarea id="pledge" maxlength="200" rows="3" placeholder="내가 실천하고 싶은 행동">${esc(state.pledge)}</textarea><p class="muted">종료하거나 새로고침하면 나의 기록이 지워져요.</p>${btn('discussion','함께 이야기할 질문',false,'text-button')}`:state.reportPage===0?noteSection(0):state.reportPage<3?noteSection(1,state.reportPage-1):state.reportPage===3?noteSection(2):supportNote(state.reportPage-4)}</article>`,`${btn('report-prev','이전',state.reportPage===0,'quiet')}${btn(last?'finish':'report-next',last?'활동 끝내기':'다음 페이지')}`,'report');
}
function render(){
  if(story){renderStory();return;}
  if(state.stage===0){shell(`<div class="intro-art"><img src="preview.svg" alt="메시지와 사진을 실로 연결한 사건 보드와 픽셀 탐정"><span class="stamp">새 사건</span></div>${title('사이버폭력 탐정단','사라진 친구의 메시지','지안이가 단톡방을 나갔다. 남겨진 대화 속에서 단서를 찾아라.')}<p class="intro-note">20~25분 · 가상의 사건<br>실제 친구의 이름이나 경험은 쓰지 않아도 괜찮아요.</p>`,btn('start','사건 파일 열기'),'intro');return;}
  if(state.stage===1){if(state.view==='board')renderBoard();else if(state.view==='evidence')renderEvidence();else renderFiles();return;}
  if(state.stage===2){renderConcept();return;}
  if(state.stage===3){renderWriting();return;}
  if(state.stage===4){if(state.supportMode)renderSupport();else renderPlan();return;}
  if(state.stage===5){renderConnection();return;}
  if(state.stage===6){renderQuiz();return;}
  renderReport();
}
function clueQuestion(m){return `<h2 id="dialog-title" tabindex="-1">이 말을 고른 이유는?</h2><blockquote>${esc(m.text)}</blockquote><div class="reason-list">${reasonChoices(m).map(i=>`<button class="quiet" data-reason="${i}">${reasons[i]}</button>`).join('')}</div>`;}
function openClue(id){
  const m=messages.find(m=>m.id===id);if(!m)return;activeClue=id;
  modal(clueQuestion(m));
}
function summarizeEvidence(){state.concept=0;talk(['일곱 개의 단서가 연결됐어. 비하와 따돌림뿐 아니라 거짓 소문, 개인정보 공개, 협박도 있었어.','이제 단서의 의미를 한 장씩 확인하고, 우리가 직접 말을 바꿔 보자.'],()=>go(2));}
function showBoard(){state.view='board';state.latest=null;go(1);}
app.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||target.disabled)return;
  if(target.dataset.room){state.room=target.dataset.room;state.view='evidence';render();return;}
  if(target.dataset.clue){openClue(target.dataset.clue);return;}
  if(target.dataset.boardNote){const m=messages.find(m=>m.id===target.dataset.boardNote);modal(`<h2 id="dialog-title" tabindex="-1">연결된 단서 · ${m.name}</h2><blockquote>${esc(m.text)}</blockquote><p>${m.feedback}</p>`);return;}
  if(target.dataset.supportChoice!==undefined){if(chooseSupport(state,Number(target.dataset.supportChoice)))render();return;}
  if(target.dataset.plan){const id=target.dataset.plan;state.plan=state.plan.includes(id)?state.plan.filter(x=>x!==id):[...state.plan,id];render();app.querySelector(`[data-plan="${id}"]`).focus({preventScroll:true});return;}
  if(target.dataset.removePlan){state.plan=state.plan.filter(id=>id!==target.dataset.removePlan);render();return;}
  if(target.dataset.response!==undefined){state.response=Number(target.dataset.response);render();return;}
  if(target.dataset.answer!==undefined){if(state.answers[state.quiz]!==undefined)return;state.answers[state.quiz]=target.dataset.answer==='true';render();return;}
  const action=target.dataset.action;
  if(action==='start')talk(['반 단톡방에서 지안이의 메시지가 멈췄어. 무슨 일이 있었는지 함께 살펴볼까?','우리가 찾는 건 친구의 잘못이 아니야. 친구를 힘들게 한 말과 행동을 찾는 거야.','SNS 게시물과 단톡방을 조사해 보자. 단서를 찾으면 사건 보드에 연결할게.'],()=>go(1));
  else if(action==='speech-prev'&&story&&story.index>0){
    stepDialogue(story,-1);render();
    app.querySelector(story.index?'[data-action="speech-prev"]':'[data-action="speech-next"]')?.focus({preventScroll:true});
  }
  else if(action==='speech-next'&&speechNext){
    typer.advance(speechNext);
    app.querySelector('[data-action="speech-next"]')?.focus({preventScroll:true});
  }
  else if(action==='skip-story')endStory();
  else if(action==='review-prev'&&state.planReviewPage>0){state.planReviewPage--;render();}
  else if(action==='review-next'&&state.planReviewPage<state.plan.length-1){state.planReviewPage++;render();}
  else if(action==='board-prev'&&state.boardPage>0){state.boardPage--;render();}
  else if(action==='board-next'&&state.boardPage<boardPageCount-1){state.boardPage++;render();}
  else if(action==='board')showBoard();
  else if(action==='resume-evidence'){state.view='evidence';render();}
  else if(action==='evidence-done'&&evidenceReady(state))summarizeEvidence();
  else if(action==='concept-back'){if(state.concept){state.concept--;render();}else showBoard();}
  else if(action==='concept-next'){if(state.concept<concepts.length-1){state.concept++;render();}else{state.mission=0;state.preview=false;talk(['이번에는 네가 말할 차례야. 외모를 평가하는 대신 친구의 노력과 참여를 존중하는 말을 써 보자.','자동으로 정답을 판정하지 않아. 네 문장을 읽고, 친구를 존중하는 말인지 직접 확인해 줘.'],()=>go(3));}}
  else if(action==='hint'){const w=writing[state.mission];modal(`<h2 id="dialog-title" tabindex="-1">말문을 여는 힌트</h2><ul>${w.hints.map(h=>`<li>${h}</li>`).join('')}</ul><p>${w.example}</p>${btn('example','예시를 보고 바꿔 쓰기')}`);}
  else if(action==='preview'&&state.drafts[state.mission].trim()){state.preview=true;render();}
  else if(action==='edit'){state.preview=false;render();app.querySelector('#draft').focus();}
  else if(action==='save-writing'&&writingReady(state,state.mission)){state.saved[state.mission]=true;if(state.mission===0){state.mission=1;state.preview=false;render();}else{state.planReview=false;state.supportMode=true;state.supportPage=0;state.supportFeedback=false;talk(['이번에는 거짓 소문, 개인정보 공개, 협박 상황에서 친구를 도와보자.','유형마다 건넬 말과 도울 행동을 하나씩 골라 줘. 선택의 영향을 읽고 다시 골라도 괜찮아.'],()=>go(4));}}
  else if(action==='writing-back'){if(state.mission===1){state.mission=0;render();}else go(2);}
  else if(action==='support-clue'){const item=supportCases[supportSteps[state.supportPage].caseIndex],m=messages.find(m=>m.id===item.clue);modal(`<h2 id="dialog-title" tabindex="-1">${item.name} · 찾았던 단서</h2><blockquote>${esc(m.text)}</blockquote><p>${m.feedback}</p>`);}
  else if(action==='support-retry'){state.supportFeedback=false;render();}
  else if(action==='support-back'){if(state.supportPage){state.supportPage--;state.supportFeedback=false;render();}else{state.mission=1;state.preview=false;go(3);}}
  else if(action==='support-next'&&supportSelection(state)?.safe){if(state.supportPage<supportSteps.length-1){state.supportPage++;state.supportFeedback=false;render();}else if(supportReady(state)){state.supportMode=false;render();}}
  else if(action==='back-support'){state.supportMode=true;state.supportPage=supportSteps.length-1;state.supportFeedback=false;render();}
  else if(action==='back-writing'){state.mission=0;state.preview=false;go(3);}
  else if(action==='action-prev'&&state.actionPage>0){state.actionPage--;render();}
  else if(action==='action-next'&&state.actionPage<actions.length-1){state.actionPage++;render();}
  else if(action==='plan-review'){state.planReview=true;state.planReviewPage=0;render();}
  else if(action==='plan-cards'){state.planReview=false;render();}
  else if(action==='plan-done'&&planReady(state)&&supportReady(state))go(5);
  else if(action==='back-plan'){state.planReview=true;go(4);}
  else if(action==='response-retry'){state.response=null;render();}
  else if(action==='connection-done'&&state.response===1)talk([{speaker:'지안',text:'내가 걱정하는 것도 같이 말해 줄래?'},{speaker:'나',text:'응. 네가 더 불편해지지 않게 도와달라고 함께 말씀드리자.'},'도움 요청이 시작됐어. 상황이 나아지는지 계속 살피는 것도 중요해.'],()=>go(6));
  else if(action==='quiz-next'&&state.answers[state.quiz]!==undefined){if(state.quiz<2){state.quiz++;render();}else{state.reportPage=0;go(7);}}
  else if(action==='report-prev'&&state.reportPage>0){state.reportPage--;render();}
  else if(action==='report-next'&&state.reportPage<4+supportCases.length){state.reportPage++;render();}
  else if(action==='discussion')modal('<h2 id="dialog-title" tabindex="-1">함께 이야기할 질문</h2><ol><li>장난이라는 말과 상대가 받는 영향은 어떻게 다를까요?</li><li>직접 “그만해”라고 말하기 어려울 때도 할 수 있는 도움은 무엇일까요?</li><li>기록 보관과 피해 내용 재유포는 무엇이 다를까요?</li></ol><p>실제 경험이나 개인 결과를 공개하지 않고 가상 사건으로 이야기해요.</p>');
  else if(action==='finish')reset();
});
app.addEventListener('keydown',event=>{
  if(!event.target.closest('.speech-directional')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();if(event.repeat)return;
  app.querySelector(`[data-action="${event.key==='ArrowLeft'?'speech-prev':'speech-next'}"]`)?.click();
});
app.addEventListener('input',event=>{
  if(event.target.id==='draft'){const i=state.mission;state.drafts[i]=event.target.value;state.saved[i]=false;state.reviews[i]=[false,false];document.querySelector('#draft-count').textContent=state.drafts[i].length;app.querySelector('[data-action="preview"]').disabled=!state.drafts[i].trim();}
  if(event.target.id==='pledge')state.pledge=event.target.value;
});
app.addEventListener('change',event=>{if(event.target.dataset.review!==undefined){state.reviews[state.mission][Number(event.target.dataset.review)]=event.target.checked;app.querySelector('[data-action="save-writing"]').disabled=!writingReady(state,state.mission);}});
dialogBody.addEventListener('click',event=>{
  const example=event.target.closest('[data-action="example"]');
  if(example){state.drafts[state.mission]=writing[state.mission].example;state.reviews[state.mission]=[false,false];state.saved[state.mission]=false;dialog.close();render();app.querySelector('#draft').focus();return;}
  if(event.target.closest('[data-action="retry-clue"]')&&activeClue){dialogBody.innerHTML=clueQuestion(messages.find(m=>m.id===activeClue));dialog.scrollTop=0;dialog.querySelector('h2').focus();return;}
  const target=event.target.closest('[data-reason]');if(!target||target.disabled||!activeClue)return;
  const m=messages.find(m=>m.id===activeClue),already=state.clues.includes(m.id),correct=inspect(state,m.id,Number(target.dataset.reason));
  dialogBody.innerHTML=`<h2 id="dialog-title" tabindex="-1">${correct?(m.clue?'단서를 찾았어!':'이 말은 단서가 아니야'):'다시 살펴볼까?'}</h2><blockquote>${esc(m.text)}</blockquote><div id="clue-feedback" class="feedback" role="status"><p>${m.feedback}</p></div>${!correct?btn('retry-clue','이유 다시 고르기'):''}`;
  if(correct&&m.clue&&!already){pendingClue=m.id;dialog.querySelector('form button').textContent='사건 보드에 연결';}
  dialog.scrollTop=0;dialog.querySelector('h2').focus();
});
document.querySelector('#notes').onclick=()=>modal(`<span class="eyebrow">PRIVATE CASE NOTES</span><h2 id="dialog-title" tabindex="-1">나의 사건 수첩</h2>${notebook()}<p class="muted">선택과 문장은 이 페이지에서만 유지됩니다.</p>`);
document.querySelector('#guide').onclick=()=>modal('<h2 id="dialog-title" tabindex="-1">탐정단 활동 안내</h2><p>파일 조사 → 사건 보드 연결 → 댓글 바꾸기 → 유형별 말과 행동 선택 → 해결 계획 → 최종 확인 순서로 진행해요. 약 20~25분 걸려요.</p><h3>회로와 함께 한 장면씩</h3><p>대사는 순서대로 나타나요. 말풍선 오른쪽을 누르면 대사가 완성되고, 다시 누르면 다음 대사나 조사로 넘어가요. 왼쪽을 누르면 이전 대사로 돌아가요. 이미 읽은 대사는 바로 표시해요. 처음 대사를 다 읽으면 좌우 안내가 3초 동안 나타나고 사라져요. 이후 대사에는 안내를 반복하지 않아요. SNS 댓글과 단톡방은 아래로 스크롤하며 조사해요. 키보드에서는 말풍선에 초점을 둔 뒤 Enter·Space 또는 좌우 방향키를 눌러요. 사건 보드에서는 말풍선 전체로 조사를 이어가요. “대사 건너뛰기”는 브리핑 전체를 넘겨요. 기기의 동작 감소 설정에서는 대사가 즉시 보여요.</p><h3>나만 보는 사건 수첩</h3><p>선택과 문장은 서버나 브라우저 저장소에 저장하지 않아요. 교사도 개인 결과나 완료 인원을 조회할 수 없어요. 종료·새로고침·페이지 이탈 시 지워져요.</p><h3>함께 이야기하기</h3><p>실제 친구의 이름이나 피해 경험, 개인 결과 공개를 요구하지 않고 가상 사건을 토의해요. 자동 글쓰기 평가나 점수·순위는 없어요.</p>');
motion.addEventListener('change',()=>{if(motion.matches)typer.finish();});
window.addEventListener('pagehide',()=>{leaving=true;typer.stop();pendingClue=null;story=null;if(dialog.open)dialog.close();dialogBody.innerHTML='';returnFocus=null;activeClue=null;state=newCase();render();});
window.addEventListener('pageshow',()=>{leaving=false;});
// Keep the scene and its footer above mobile keyboards without rebuilding inputs.
function fitViewport(){document.documentElement.style.setProperty('--viewport-height',`${window.visualViewport?.height||window.innerHeight}px`);}
window.visualViewport?.addEventListener('resize',fitViewport);
window.addEventListener('resize',fitViewport);
fitViewport();
render();
