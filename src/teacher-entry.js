export function bindTeacherEntry(icon, enter, now = () => Date.now()) {
  let taps = 0, previous = 0, first = 0;
  icon.setAttribute('role', 'button');
  icon.setAttribute('tabindex', '0');
  icon.setAttribute('aria-label', '픽셀 클래스룸 아이콘');
  const activate = event => {
    event.preventDefault();
    event.stopPropagation();
    const time = now();
    if (time - previous > 900 || time - first > 4000) { taps = 0; first = time; }
    if (!taps) first = time;
    previous = time;
    if (++taps === 5) { taps = 0; enter(); }
  };
  icon.addEventListener('click', activate);
  icon.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) activate(event);
  });
}
