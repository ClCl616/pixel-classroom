import {robot} from './pixel-art.js';
import {liveCall, configured, isDemo} from './api.js';
import {startTrolley} from './trolley.js';
import {escapeHtml as esc} from './domain.js';

export function startStudentActivity({app,homeUrl,practice=false}) {
  if(practice){startTrolley({app,homeUrl});return;}
  document.body.classList.add('trolley-immersed');
  let timer=null,checking=false,launched=false;
  const cleanup=()=>clearInterval(timer);
  window.addEventListener('pagehide',cleanup,{once:true});
  const practiceUrl=new URL(location.href);practiceUrl.searchParams.set('practice','1');
  app.innerHTML=`<main class="rail-activity"><section class="rail-story rail-finish"><div class="pixel-thought" aria-hidden="true">${robot()}</div><h1 tabindex="-1">우리 교실에<br>연결하고 있어요.</h1><p id="live-wait-message" role="status">선생님이 트롤리 활동을 열면 바로 시작해요.</p></section><div class="rail-controls"><button class="btn primary full" id="live-retry">다시 확인하기</button><a class="rail-home" href="${esc(practiceUrl.href)}">혼자 체험하기</a><a class="btn quiet full" href="${homeUrl}">종료하기</a></div></main>`;
  async function check(){
    if(checking||launched||document.hidden)return;checking=true;
    const retry=app.querySelector('#live-retry');if(retry)retry.disabled=true;
    try{
      const session=await liveCall('active');
      if(session&&(session.status==='open'||session.own)){
        launched=true;cleanup();
        startTrolley({app,homeUrl,liveSession:session,submitResponse:payload=>liveCall('submit',{...payload,code:session.code}),loadPeers:()=>liveCall('peers',{code:session.code})});
      }else{
        app.querySelector('h1').innerHTML='선생님을<br>기다리고 있어요.';
        app.querySelector('#live-wait-message').textContent=session?'지금은 응답이 마감되었어요. 선생님이 다시 열면 참여할 수 있어요.':'선생님이 트롤리 활동을 열면 자동으로 시작해요.';
      }
    }catch(error){const message=app.querySelector('#live-wait-message');if(message)message.textContent=error.message||'연결을 확인한 뒤 다시 시도해 주세요.';}
    finally{checking=false;if(retry?.isConnected)retry.disabled=false;}
  }
  app.querySelector('#live-retry').onclick=check;
  check();if(configured||isDemo)timer=setInterval(check,3000);
}
