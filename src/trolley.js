import {choices, escapeHtml as esc, validateResponse} from './domain.js';

const questions = {
  switch: '피해를 입는 사람 수 외에, 결정을 내릴 때 고려할 점은 무엇일까요?',
  stay: '행동하지 않는 선택에도 책임이 있을까요?',
  hold: '판단을 내리려면 어떤 정보나 기준이 더 필요할까요?',
};

// This activity keeps the response only in the current page's memory.
export function startTrolley({app, header, scene, homeUrl}) {
  let choice = '', reason = '';
  function show(content) {
    app.innerHTML = `<div class="classroom-home">${header}<main class="trolley-main">${content}</main><footer class="home-footer">PIXEL CLASSROOM</footer></div>`;
  }
  function focusTitle() {
    window.scrollTo(0, 0);
    app.querySelector('h1').focus({preventScroll:true});
  }
  function edit() {
    show(`<a class="text-link" href="${homeUrl}">← 활동 선택</a>
      <h1 class="student-title" tabindex="-1">트롤리 딜레마</h1>
      ${scene}
      <p class="scenario">브레이크가 고장 난 기차. 그대로 가면 다섯 명, 선로를 바꾸면 한 명이 위험해요. 멈추거나 다른 길로 피할 수 없다면, 어떤 선택을 할까요?</p>
      <form id="trolley-response">
        <div class="section-label"><span>01</span><h2>나의 선택</h2></div>
        <div class="choices" role="radiogroup" aria-label="나의 선택">${choices.map(c=>`<label class="choice ${c.color} ${choice===c.id?'selected':''}"><input type="radio" name="choice" value="${c.id}" ${choice===c.id?'checked':''} required><span class="choice-icon">${c.icon}</span><span><strong>${c.label}</strong><small>${c.hint}</small></span><span class="radio-dot"></span></label>`).join('')}</div>
        <div class="section-label"><span>02</span><h2><label for="trolley-reason">그렇게 생각한 이유</label></h2></div>
        <div class="reason-box"><textarea id="trolley-reason" name="reason" maxlength="120" rows="3" required aria-describedby="trolley-hint trolley-error" placeholder="나는 …이 중요하다고 생각해서 이렇게 선택했어요.">${esc(reason)}</textarea><div class="input-foot"><span id="trolley-hint">줄바꿈 없이 한 문장으로 써 주세요.</span><span id="trolley-counter">${reason.length} / 120</span></div></div>
        <p id="trolley-error" class="form-error" role="alert"></p>
        <button class="btn primary full" type="submit">내 생각 돌아보기 →</button>
        <p class="micro">작성한 내용은 이 화면에서만 볼 수 있어요. 페이지를 나가면 사라져요.</p>
      </form>`);
    const form = app.querySelector('#trolley-response');
    form.addEventListener('change', () => {
      choice = form.elements.choice.value;
      form.querySelectorAll('.choice').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
    });
    app.querySelector('#trolley-reason').addEventListener('input', e => {
      reason = e.target.value;
      app.querySelector('#trolley-counter').textContent = `${reason.length} / 120`;
      app.querySelector('#trolley-error').textContent = '';
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      choice = form.elements.choice.value;
      reason = form.elements.reason.value;
      try { reason = validateResponse(choice, reason); }
      catch (error) { app.querySelector('#trolley-error').textContent = error.message; return; }
      reflect();
      focusTitle();
    });
  }
  function reflect() {
    const selected = choices.find(c => c.id === choice);
    show(`<h1 class="student-title" tabindex="-1">내 생각 돌아보기</h1>
      <article class="reason-card ${selected.color}"><span>${selected.icon} ${selected.label}</span><p>“${esc(reason)}”</p></article>
      <section class="trolley-reflection"><h2>한 걸음 더 생각해 보기</h2><p>${questions[choice]}</p></section>
      <section class="trolley-perspectives"><h2>다른 관점도 살펴봐요</h2><p>피해를 줄이는 것, 한 사람에게 위험을 옮기지 않는 것, 충분한 근거를 갖추는 것. 사람마다 중요하게 여기는 기준은 다를 수 있어요.</p><p>선택이 다른 친구와 서로의 이유를 이야기해 보세요.</p></section>
      <div class="trolley-actions"><button class="btn quiet full" id="trolley-edit">내 생각 다시 쓰기</button><a class="btn primary full" href="${homeUrl}">활동 마치기</a></div>`);
    app.querySelector('#trolley-edit').onclick = () => { edit(); focusTitle(); };
  }
  edit();
}
