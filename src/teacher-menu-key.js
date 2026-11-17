// Ignore typing, IME input, held keys and browser shortcuts.
export function bindTeacherMenuKey(target, getDialog, hasOtherDialog = () => false) {
  const onKey = event => {
    if(event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey)return;
    if(event.target?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
    if(event.code !== 'KeyP' && event.key?.toLowerCase() !== 'p')return;
    const dialog=getDialog();
    if(!dialog || hasOtherDialog())return;
    event.preventDefault();
    if(dialog.open)dialog.close();else dialog.showModal();
  };
  target.addEventListener('keydown',onKey);
  return () => target.removeEventListener('keydown',onKey);
}
