export const reasons = ['외모를 깎아내리는 말이에요.', '특정 친구를 일부러 대화에서 제외해요.', '친구를 존중하거나 피해를 멈추도록 도와요.', '이 메시지만으로는 더 살펴봐야 해요.', '거짓 이야기를 만들어 퍼뜨려요.', '동의 없이 개인정보를 공개해요.', '겁을 주며 행동을 강요해요.'];
export const clueTypes={0:'외모 비하',1:'따돌림',4:'거짓 소문',5:'개인정보 공개',6:'협박·강요'};
// Four choices per investigation keep the mobile dialog manageable.
export function reasonChoices(message){return message.reason===4||message.reason===5?[4,5,2,3]:message.reason===6?[6,1,2,3]:[0,1,2,3];}
export const messages = [
  {id:'a1', room:'sns', name:'서준', text:'표정 왜 저래 ㅋㅋ', reason:0, clue:true, feedback:'웃음 표시가 있어도, 다른 사람의 외모를 조롱하는 말이 될 수 있어요.'},
  {id:'a2', room:'sns', name:'하린', text:'그 얼굴로 발표한 거야?', reason:0, clue:true, feedback:'발표 내용에 대한 의견보다 친구의 외모를 공격하고 있어요.'},
  {id:'a3', room:'sns', name:'유나', text:'발표 준비하느라 고생했어!', reason:2, clue:false, feedback:'친구의 노력을 인정하고 응원하는 말이에요. 문제 행동의 단서에는 넣지 않아요.'},
  {id:'a4', room:'sns', name:'서준', text:'지안이가 발표 자료 훔쳤다고 소문내자. 내가 지어낸 얘기야.', boardText:'지어낸 이야기를 소문내자', reason:4, clue:true, feedback:'사실이 아닌 것을 알면서 친구에 대한 소문을 만들고 퍼뜨리려는 말이에요. 확인되지 않은 이야기에도 동조하거나 전달하지 않아요.'},
  {id:'a5', room:'sns', name:'유나', text:'지어낸 이야기를 퍼뜨리면 안 돼. 이 글은 지우자.', reason:2, clue:false, feedback:'거짓 소문을 멈추려는 말이에요. 문제를 지적하는 말이라고 해서 상대를 공격하는 단서가 되는 것은 아니에요.'},
  {id:'a6', room:'sns', name:'하린', text:'허락은 안 받았어. 지안이 번호 여기 올릴게. [번호 가림]', boardText:'허락 없이 전화번호 공개', reason:5, clue:true, feedback:'당사자 동의 없이 연락처를 공개하면 원치 않는 연락 등 피해로 이어질 수 있어요. 실제 번호는 표시하지 않았어요. 다른 곳에 옮기지 말고 삭제와 도움을 요청해요.'},
  {id:'a7', room:'sns', name:'유나', text:'번호는 다시 공유하지 말자. 선생님께 도움을 요청할게.', reason:2, clue:false, feedback:'개인정보가 더 퍼지지 않게 멈추고 도움을 연결하는 말이에요. 공개된 번호를 다시 공유하는 행동과 구분해요.'},
  {id:'b1', room:'chat', name:'유나', text:'내일 발표 연습 몇 시에 할까?', reason:3, clue:false, feedback:'연습 시간을 묻는 말이에요. 이 메시지만으로 누군가를 배제한다고 판단하기는 어려워요.'},
  {id:'b2', room:'chat', name:'지안', text:'나도 같이 준비할게.', reason:2, clue:false, feedback:'함께 참여하고 싶다는 말이에요. 피해를 받은 친구의 말 자체를 문제로 고르지 않도록 살펴봐요.'},
  {id:'b3', room:'chat', name:'서준', text:'지안이는 빼고 따로 방 만들자.', reason:1, clue:true, feedback:'특정 친구를 일부러 제외하려는 말이에요. 사이버 따돌림을 살펴볼 단서예요.'},
  {id:'b4', room:'chat', name:'하린', text:'ㅇㅋ 여기서는 말하지 마.', reason:1, clue:true, feedback:'앞선 메시지와 함께 보면, 친구를 제외하는 행동에 동참하고 있어요.'},
  {id:'b6', room:'chat', name:'서준', text:'선생님께 말하면 네 사진을 계속 올릴 거야. 아무 말도 하지 마.', boardText:'말하면 사진을 계속 올릴 거야', reason:6, clue:true, feedback:'사진을 퍼뜨리겠다고 겁을 주며 도움을 요청하지 못하게 하는 말이에요. 혼자 참거나 요구를 따르기보다 믿을 만한 어른에게 이 위협까지 함께 알려요.'},
  {id:'b7', room:'chat', name:'유나', text:'혼자 참지 않아도 돼. 걱정되는 것도 같이 말씀드리자.', reason:2, clue:false, feedback:'피해를 받은 친구에게 책임을 돌리지 않고, 걱정과 도움 요청을 함께 살피는 말이에요.'},
  {id:'b5', room:'chat', name:'지안', text:'왜 나만 빼…?', reason:3, clue:false, feedback:'배제된 친구가 이유를 묻고 있어요. 이 말 자체보다 앞에서 친구를 제외한 행동을 살펴봐요.'}
];
export const clueMessages=messages.filter(m=>m.clue);
export const clueCount=clueMessages.length;
export const writing = [
  {title:'외모 비하 댓글 바꾸기', original:'그 얼굴로 발표한 거야?', prompt:'외모를 평가하지 않고, 친구의 노력이나 발표에 관해 말해 볼까요?', hints:['발표 준비하느라…','발표에서 인상 깊었던 건…','긴장했을 텐데…'], example:'긴장했을 텐데 끝까지 발표하느라 고생했어.'},
  {title:'친구를 제외하는 말 바꾸기', original:'지안이는 빼고 따로 방 만들자.', prompt:'한 친구만 제외하지 않고, 함께 이야기할 수 있도록 바꿔 볼까요?', hints:['지안이 의견도…','같이 준비하는 일이니까…','불편한 일이 있다면…'], example:'같이 준비하는 일이니까 지안이 의견도 들어보자.'}
];
export const actions = [
  {id:'listen', title:'마음을 듣고 필요한 도움 묻기', detail:'“네 잘못이 아니야. 어떤 도움이 필요해?”처럼 마음과 의사를 함께 살펴요.', safe:true},
  {id:'record', title:'필요한 기록을 안전하게 보관하기', detail:'안전하게 확보할 수 있는 메시지 내용과 시간, 대화 맥락을 남겨요. 다른 친구들에게 퍼뜨리기 위한 저장은 아니에요.', safe:true},
  {id:'adult', title:'믿을 만한 어른에게 함께 도움 요청하기', detail:'보호자나 교사에게 상황과 함께 “더 놀림받을까 걱정된다”는 점도 전해요.', safe:true},
  {id:'report', title:'플랫폼 신고·차단 기능 이용하기', detail:'불편한 연락을 줄이거나 문제 내용을 알리는 방법이에요. 다른 곳의 게시물까지 모두 사라지는 것은 아니에요.', safe:true},
  {id:'stop', title:'안전하게 말할 수 있다면 중단 요청하기', detail:'“친구를 빼거나 외모를 놀리는 말은 멈추자.”라고 말할 수 있어요. 공개적으로 나서기 어렵다면 다른 도움 방법을 골라도 괜찮아요.', safe:true},
  {id:'revenge', title:'서준이를 똑같이 놀리는 글 올리기', detail:'상대를 공격하는 행동은 피해와 갈등을 더 늘릴 수 있어요. 이 카드를 해제하고 친구를 보호하는 방법으로 바꿔 봐요.', safe:false},
  {id:'share', title:'친구들에게 사건 화면을 널리 공유하기', detail:'상황을 알리려는 의도여도 조롱과 피해가 다시 퍼질 수 있어요. 이 카드를 해제하고 필요한 사람에게 제한적으로 도움을 요청해요.', safe:false}
];
export const responses = [
  {text:'네가 더 강하게 말했어야지.', feedback:'피해를 멈추게 할 책임을 지안이에게 돌리는 말이 될 수 있어요. 지안이가 혼자 해결해야 하는 일은 아니에요.'},
  {text:'네 잘못이 아니야. 계속되고 있다는 것도 선생님께 같이 말씀드리자.', feedback:'친구를 탓하지 않고, 상황이 이어지고 있다는 사실까지 도움을 줄 어른에게 연결하는 말이에요.'},
  {text:'우리도 다른 방에서 걔들 욕하자.', feedback:'친구를 위하려는 마음이어도 보복은 새로운 피해를 만들 수 있어요. 친구를 보호하는 방법을 다시 골라 봐요.'}
];
export const quizzes = [
  {question:'인터넷에서 벌어진 일이므로 실제 피해는 없다.', answer:false, feedback:'온라인의 말과 행동도 상대의 마음과 일상에 영향을 줄 수 있어요.'},
  {question:'안전하게 확보할 수 있는 필요한 기록을 남기는 것은 도움을 요청할 때 도움이 된다.', answer:true, feedback:'시간과 대화 맥락을 함께 남기고, 널리 퍼뜨리지 않아요.'},
  {question:'재미로 게시물을 공유하거나 조롱 댓글을 다는 행동도 피해를 확산시킬 수 있다.', answer:true, feedback:'직접 시작하지 않았더라도 확산에 참여하는 행동이 될 수 있어요.'}
];
export function newCase() { return {stage:0, room:'sns', view:'files', latest:null, boardPage:0, concept:0, actionPage:0, planReview:false, planReviewPage:0, evidencePage:{sns:0,chat:0}, reportPage:0, visited:[], clues:[], drafts:['',''], reviews:[[false,false],[false,false]], saved:[false,false], mission:0, preview:false, plan:[], response:null, quiz:0, answers:[], pledge:''}; }
export function inspect(state,id,reason) {
  const item=messages.find(m=>m.id===id);
  if(!item || item.reason!==reason)return false;
  if(item.clue&&!state.clues.includes(id))state.clues.push(id);
  return true;
}
export function evidenceReady(state) { return clueMessages.every(m=>state.clues.includes(m.id))&&['sns','chat'].every(room=>state.visited.includes(room)); }
export function writingReady(state,index) {return state.drafts[index].trim().length>0&&state.drafts[index].length<=200&&state.reviews[index].every(Boolean);}
export function planReady(state) { return new Set(state.plan).size>=2&&state.plan.every(id=>actions.some(a=>a.id===id&&a.safe)); }
export function escapeHtml(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
