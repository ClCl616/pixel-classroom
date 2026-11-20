import {messages, escapeHtml as esc} from './data.js';

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

export function evidencePages(room){
  const items=messages.filter(m=>m.room===room);
  // Keep exclusion and the agreeing reply together; the next page shows its impact.
  return [items.slice(0,2),items.slice(2,4),items.slice(4)].filter(page=>page.length);
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

export function caseBoard(clues,latest=null){
  const pins=messages.filter(m=>m.clue),positions=[[23,23],[77,23],[23,77],[77,77]];
  return `<div class="case-board" aria-label="사건 보드 · 연결된 단서 ${clues.length}개"><svg class="board-threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${pins.map((m,i)=>clues.includes(m.id)?`<path class="thread ${m.id===latest?'new-thread':''}" pathLength="1" d="M50 50 L${positions[i][0]} ${positions[i][1]}"/>`:'').join('')}</svg><div class="board-center"><span>CASE 03</span><strong>사라진 메시지</strong><small>${clues.length} / 4 연결</small></div>${pins.map((m,i)=>{const found=clues.includes(m.id);return found?`<button class="board-pin pin-${i} ${m.id===latest?'new-pin':''}" data-board-note="${m.id}"><i aria-hidden="true"></i><small>${m.room==='sns'?'SNS · 외모 비하':'단톡방 · 배제'}</small><span>${esc(m.text)}</span></button>`:`<div class="board-pin pin-${i} unknown"><i aria-hidden="true"></i><small>미발견 단서 ${i+1}</small><span>?</span></div>`;}).join('')}</div>`;
}

export const concepts=[
  {name:'사이버 언어폭력',tag:'이번 사건에서 확인',body:'온라인에서 욕설이나 비하하는 말로 상대를 공격하는 행동',example:'“그 얼굴로 발표한 거야?”',color:'mint'},
  {name:'사이버 따돌림',tag:'이번 사건에서 확인',body:'온라인 모임이나 대화에서 특정 사람을 의도적으로 배제하는 행동',example:'“지안이는 빼고 따로 방 만들자.”',color:'lilac'},
  {name:'거짓 정보 유포',tag:'함께 알아두기',body:'확인되지 않거나 거짓인 이야기를 퍼뜨려 상대에게 피해를 주는 행동',example:'이번 사건에서 확인된 단서는 아니에요.',color:''}
];

// Returns false only when moving forward beyond the final dialogue page.
export function stepDialogue(story,direction){
  if(direction<0){story.index=Math.max(0,story.index-1);return true;}
  if(story.index>=story.lines.length-1)return false;
  story.index++;return true;
}
