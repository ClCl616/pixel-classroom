import {pupil} from './pixel-art.js';

// Walk along the classroom's left aisle, then across the destination row.
export function enterClassroom(grid,slot,seat) {
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return ()=>{};
 const target=slot.querySelector('.pupil-seat');
 const room=grid.getBoundingClientRect(), end=target.getBoundingClientRect();
 const width=end.width,height=end.height;
 const x=end.left-room.left,y=end.top-room.top;
 const startY=Math.max(0,room.height-height),aisle=0;
 const walker=document.createElement('div');
 walker.className='classroom-walker walking';walker.setAttribute('aria-hidden','true');
 walker.innerHTML=pupil(seat);walker.style.width=`${width}px`;walker.style.height=`${height}px`;
 slot.classList.add('entering');grid.append(walker);
 const duration=Math.min(4200,2200+(Math.abs(startY-y)+x)*2);
 const motion=walker.animate([
  {transform:`translate(${-width}px,${startY}px)`,offset:0},
  {transform:`translate(${aisle}px,${startY}px)`,offset:.12},
  {transform:`translate(${aisle}px,${Math.max(0,y-10)}px)`,offset:.55},
  {transform:`translate(${x}px,${Math.max(0,y-10)}px)`,offset:.9},
  {transform:`translate(${x}px,${y}px)`,offset:1}
 ],{duration,easing:'linear',fill:'forwards'});
 let cancelled=false;
 motion.finished.then(()=>{
  if(cancelled||!slot.isConnected)return;
  walker.remove();slot.classList.remove('entering');slot.classList.add('seated');
 }).catch(()=>{});
 return ()=>{cancelled=true;motion.cancel();walker.remove();slot.classList.remove('entering');};
}
