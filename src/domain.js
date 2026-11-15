export const choices = [
  { id: 'switch', label: '선로를 바꾼다', short: '바꾼다', icon: '↗', color: 'mint', hint: '다른 선로로 방향을 바꿉니다.' },
  { id: 'stay', label: '바꾸지 않는다', short: '바꾸지 않는다', icon: '↑', color: 'peach', hint: '현재 선로를 유지합니다.' },
  { id: 'hold', label: '판단을 유보한다', short: '판단 유보', icon: '…', color: 'lilac', hint: '결정하기 어려운 이유를 생각합니다.' },
];
export const phases = { waiting: '참여 대기', open: '응답 받는 중', closed: '응답 마감', revealed: '결과 공개' };
export function validateResponse(choice, reason) {
  if (!choices.some(c => c.id === choice)) throw new Error('세 가지 선택지 중 하나를 골라 주세요.');
  const text = reason.trim();
  if (!text || text.length > 120 || /[\r\n]/.test(text)) throw new Error('이유를 줄바꿈 없이 1~120자 한 문장으로 써 주세요.');
  return text;
}
export function tally(responses) {
  return choices.map(choice => ({ ...choice, count: responses.filter(r => r.choice === choice.id).length, percent: responses.length ? Math.round(responses.filter(r => r.choice === choice.id).length / responses.length * 100) : 0 }));
}
export function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x])); }
