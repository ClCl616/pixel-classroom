import {messages,clueMessages,clueCount,clueTypes, escapeHtml as esc} from './data.js';

// Preserve every word and speaker while keeping each speech screen short.
export function dialoguePages(lines,limit=42){
  return lines.flatMap(line=>{
    const speaker=typeof line==='string'?'회로 탐정':line.speaker;
    const text=typeof line==='string'?line:line.text;
    return text.split(/(?<=[.!?])\s+/u).flatMap(sentence=>{
      const pages=[];let page='';
      for(const word of sentence.split(/\s+/u)){
        if(page&&`${page} ${word}`.length>limit){pages.push({speaker,text:page});page='';}
        page=page?`${page} ${word}`:word;
      }
      if(page)pages.push({speaker,text:page});
      return pages;
    });
  });
}

// Each file is one continuous, chronological feed; unknown clues stay unmarked.
export function evidenceFeed(room,clues=[]){
  return messages.filter(m=>m.room===room).map((m,index)=>`<button class="message ${room==='sns'?'social-comment':'chat-message'} ${m.name==='지안'?'from-jian':''} ${clues.includes(m.id)?'collected':''}" data-clue="${m.id}" aria-label="${esc(m.name)}: ${esc(m.text)}${clues.includes(m.id)?' · 보드에 연결됨':''}"><span class="avatar" aria-hidden="true">${m.name[0]}</span><span class="message-copy"><small>${m.name}</small><span class="bubble">${esc(m.text)}</span><span class="message-meta">${room==='sns'?'어제 · 댓글':`오후 3:${String(30+index).padStart(2,'0')}`}</span></span><span class="clue-mark" aria-hidden="true">${clues.includes(m.id)?'✓':''}</span></button>`).join('');
}

// Cancel on scene exit so an old cue cannot change a new dialogue screen.
export function createTimedCue({schedule=setTimeout,cancel=clearTimeout}={}){
  let timer=null;
  function stop(){if(timer!==null)cancel(timer);timer=null;}
  return {stop,show(element){stop();element.hidden=false;timer=schedule(()=>{element.remove();timer=null;},3000);}};
}

// One owned timer: leaving a scene or revealing a line cancels pending work.
export function createTypewriter({schedule=setTimeout,cancel=clearTimeout}={}) {
  let timer=null, chars=[], position=0, write=()=>{}, done=()=>{}, generation=0;
  function stop(){generation++;if(timer!==null)cancel(timer);timer=null;chars=[];position=0;write=()=>{};done=()=>{};}
  function finish(){if(timer!==null)cancel(timer);timer=null;position=chars.length;write(chars.join(''));const callback=done;done=()=>{};callback();}
  function start(text,onWrite,onDone=()=>{},instant=false){
    stop();chars=Array.from(text);write=onWrite;done=onDone;const token=generation;
    if(instant||!chars.length){finish();return;}
    write('');
    const tick=()=>{if(token!==generation)return;position=Math.min(chars.length,position+2);write(chars.slice(0,position).join(''));if(position===chars.length){timer=null;const callback=done;done=()=>{};callback();}else timer=schedule(tick,32);};
    timer=schedule(tick,32);
  }
  return {start,stop,finish,isTyping:()=>timer!==null,advance:onNext=>{if(timer!==null)finish();else onNext();}};
}

export const detectivePortrait=`<svg class="detective-portrait" viewBox="0 0 80 80" aria-hidden="true" shape-rendering="crispEdges"><path fill="#173d37" d="M20 4h36v8h8v12h8v8H8v-8h8V12h4zM16 32h48v32H16zM24 64h32v12H24z"/><path fill="#d4ae78" d="M24 8h28v12H24zM16 24h48v4H16z"/><path fill="#79d6a7" d="M20 36h40v24H20z"/><path fill="#fff6da" d="M24 40h32v16H24z"/><path fill="#173d37" d="M28 44h6v6h-6zM46 44h6v6h-6z"/><path fill="#f2c4a5" d="M16 52h8v4h-8zM56 52h8v4h-8z"/><path fill="#b5e1bb" d="M28 64h24v8H28z"/><path fill="#173d37" d="M52 53h12v4h4v12h-4v4h-12v-4h-4V57h4zM64 69h8v8h-8z"/><path fill="#d7cbee" d="M54 57h8v10h-8z"/></svg>`;

export const boardPageCount=Math.ceil(clueCount/4);
export function boardPageFor(id){return Math.max(0,Math.floor(clueMessages.findIndex(m=>m.id===id)/4));}
export function caseBoard(clues,latest=null,page=0){
  const pins=clueMessages.slice(page*4,page*4+4),positions=[[23,23],[77,23],[23,77],[77,77]];
  return `<div class="case-board" aria-label="사건 보드 · 연결된 단서 ${clues.length}개"><svg class="board-threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${pins.map((m,i)=>clues.includes(m.id)?`<path class="thread ${m.id===latest?'new-thread':''}" pathLength="1" d="M50 50 L${positions[i][0]} ${positions[i][1]}"/>`:'').join('')}</svg><div class="board-center"><span>CASE 03</span><strong>사라진 메시지</strong><small>${clues.length} / ${clueCount} 연결</small></div>${pins.map((m,i)=>{const found=clues.includes(m.id);return found?`<button class="board-pin pin-${i} ${m.id===latest?'new-pin':''}" data-board-note="${m.id}"><i aria-hidden="true"></i><small>${clueTypes[m.reason]}</small><span>${esc(m.boardText||m.text)}</span></button>`:`<div class="board-pin pin-${i} unknown"><i aria-hidden="true"></i><small>미발견 단서 ${page*4+i+1}</small><span>?</span></div>`;}).join('')}</div>`;
}

export const concepts=[
  {name:'사이버 언어폭력',tag:'이번 사건에서 확인',body:'온라인에서 욕설이나 비하하는 말로 상대를 공격하는 행동',example:'“그 얼굴로 발표한 거야?”',color:'mint'},
  {name:'사이버 따돌림',tag:'이번 사건에서 확인',body:'온라인 모임이나 대화에서 특정 사람을 의도적으로 배제하는 행동',example:'“지안이는 빼고 따로 방 만들자.”',color:'lilac'},
  {name:'거짓 소문 퍼뜨리기',tag:'이번 사건에서 확인',body:'사실이 아닌 이야기를 만들어 퍼뜨려 친구에게 피해를 주는 행동',example:'“내가 지어낸 얘기야.”라는 말에서 거짓임을 알 수 있어요.',color:''},
  {name:'개인정보 공개',tag:'이번 사건에서 확인',body:'동의 없이 연락처 같은 개인정보를 온라인에 공개하는 행동',example:'공개된 정보라도 다시 옮기지 않아요. 삭제와 도움을 요청해요.',color:'mint'},
  {name:'온라인 협박·강요',tag:'이번 사건에서 확인',body:'사진 등을 퍼뜨리겠다고 겁을 주며 원하지 않는 행동을 하게 하거나 도움 요청을 막는 행동',example:'“선생님께 말하면 네 사진을 계속 올릴 거야.”',color:'lilac'}
];

// Returns false only when moving forward beyond the final dialogue page.
export function stepDialogue(story,direction){
  if(direction<0){story.index=Math.max(0,story.index-1);return true;}
  if(story.index>=story.lines.length-1)return false;
  story.index++;return true;
}
