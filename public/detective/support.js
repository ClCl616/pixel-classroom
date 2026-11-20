// Follow each new clue with one choice of words and one practical action.
export const supportCases=[
  {id:'rumor',name:'거짓 소문',clue:'a4',situation:'지안이가 “다들 소문을 믿으면 어떡하지?”라고 걱정해요.',
    words:[
      {text:'억울하면 네가 직접 모두에게 해명해.',safe:false,feedback:'피해를 받은 친구에게 혼자 해결할 책임을 넘길 수 있어요. 곁에서 이야기를 듣고 도움을 함께 찾아요.'},
      {text:'지어낸 소문은 네 잘못이 아니야. 함께 도움을 찾자.',safe:true,feedback:'친구를 탓하지 않고 마음을 지지하는 말이에요. 소문을 반복해 전하지 않으며 필요한 도움을 함께 물어요.'},
      {text:'우리도 서준이에 대한 소문을 만들자.',safe:false,feedback:'보복성 소문은 또 다른 피해를 만들어요. 친구를 보호하고 거짓 이야기가 더 퍼지지 않게 도와요.'}],
    actions:[
      {text:'소문을 옮기지 않고, 필요한 기록으로 교사에게 도움 요청하기',safe:true,feedback:'안전하게 남길 수 있는 내용과 맥락만 보관해요. 믿을 만한 어른과 정정·삭제 방법을 함께 찾고, 친구들에게 다시 퍼뜨리지 않아요.'},
      {text:'사실인지 물어보려고 소문 화면을 여러 방에 보내기',safe:false,feedback:'확인하려는 뜻이어도 거짓 이야기가 더 널리 퍼져요. 공개된 대화방 대신 도움을 줄 어른에게 제한적으로 알려요.'},
      {text:'지안이가 직접 해명할 때까지 기다리기',safe:false,feedback:'친구 혼자 소문을 바로잡게 두지 않아요. 어떤 도움이 필요한지 묻고 확산을 멈추는 데 함께해요.'}]},
  {id:'privacy',name:'개인정보 공개',clue:'a6',situation:'허락 없이 연락처가 공개되어 지안이가 불안해해요.',
    words:[
      {text:'이미 공개됐으니 그냥 신경 쓰지 마.',safe:false,feedback:'연락처가 퍼진 불안을 가볍게 넘기는 말이에요. 친구의 걱정을 듣고 정보가 더 퍼지지 않도록 도와요.'},
      {text:'어떤 번호인지 나한테도 보내 줘.',safe:false,feedback:'돕기 위해 연락처를 다시 받을 필요는 없어요. 개인정보를 더 모으거나 옮기지 않아요.'},
      {text:'많이 불안하겠다. 번호는 옮기지 않고 도움을 구하자.',safe:true,feedback:'친구의 불안을 인정하고 재공유하지 않겠다는 뜻을 전해요. 원치 않는 연락이 오는지도 함께 살펴요.'}],
    actions:[
      {text:'다른 친구들도 알도록 번호가 보이는 화면 공유하기',safe:false,feedback:'피해를 알리려다 개인정보를 다시 퍼뜨리게 돼요. 공개된 정보라도 친구들에게 재공유하지 않아요.'},
      {text:'어른과 삭제·신고를 요청하고 원치 않는 연락 차단하기',safe:true,feedback:'보호자나 교사와 게시물 삭제·신고를 요청하고 불편한 연락을 차단해요. 한 곳에서 삭제되어도 다른 곳에 남았는지 계속 살펴요.'},
      {text:'올린 친구의 번호도 찾아 공개하기',safe:false,feedback:'다른 사람의 정보까지 공개하는 보복은 피해를 늘려요. 공개된 정보를 줄이고 친구를 보호하는 데 집중해요.'}]},
  {id:'threat',name:'협박·강요',clue:'b6',situation:'지안이가 “말하면 사진을 더 올릴까 봐 무서워”라고 해요.',
    words:[
      {text:'무섭겠다. 네 잘못이 아니야. 어른에게 함께 알리자.',safe:true,feedback:'무서운 마음과 보복 걱정을 인정해요. 친구가 혼자 감당하지 않도록 믿을 만한 어른에게 함께 도움을 요청해요.'},
      {text:'더 올리지 않게 일단 시키는 대로 하자.',safe:false,feedback:'요구를 따르면 끝난다고 보장할 수 없어요. 혼자 대응하도록 하지 말고 위협 내용까지 어른에게 알려요.'},
      {text:'아무에게도 말하지 않겠다고 약속할게.',safe:false,feedback:'절대 비밀로 하겠다는 약속은 필요한 도움을 막을 수 있어요. 친구의 걱정을 듣고 누구에게 어떻게 도움을 구할지 함께 정해요.'}],
    actions:[
      {text:'혼자 상대를 찾아가 더 세게 경고하기',safe:false,feedback:'직접 맞서다가 위협이 커질 수 있어요. 친구나 나 혼자 해결하려 하지 말고 안전하게 도움을 연결해요.'},
      {text:'모든 메시지를 지우고 아무에게도 말하지 않기',safe:false,feedback:'위협의 내용과 맥락을 도움을 줄 사람이 알기 어려워져요. 안전하게 남길 수 있는 기록과 보복 걱정을 함께 알려요.'},
      {text:'위협 기록과 보복 걱정을 보호자·교사에게 함께 알리기',safe:true,feedback:'안전하게 확보할 수 있는 기록만 남겨요. 사진을 더 퍼뜨리겠다는 위협과 친구의 걱정을 함께 전하고, 이후 상황도 계속 살펴요.'}]}
];
export const supportSteps=supportCases.flatMap((item,index)=>['words','actions'].map(kind=>({caseIndex:index,kind})));
export function supportSelection(state,page=state.supportPage){
  const step=supportSteps[page];if(!step)return undefined;
  return supportCases[step.caseIndex][step.kind][state.supportChoices[page]];
}
export function chooseSupport(state,option){
  const step=supportSteps[state.supportPage];
  if(!step||!Number.isInteger(option)||!supportCases[step.caseIndex][step.kind][option])return false;
  state.supportChoices[state.supportPage]=option;state.supportFeedback=true;return true;
}
export function supportReady(state){return supportSteps.every((_,page)=>supportSelection(state,page)?.safe===true);}
