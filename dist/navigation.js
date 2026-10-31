(() => {
 const menu=document.querySelector('.learn-menu');
 if(!menu)return;
 const trigger=menu.querySelector('.learn-trigger'),panel=menu.querySelector('.learn-links');
 const desktop=matchMedia('(min-width:761px) and (hover:hover)');
 let closeTimer;
 let pinned=false;
 function setOpen(open){if(!open)pinned=false;clearTimeout(closeTimer);trigger.setAttribute('aria-expanded',String(open));panel.hidden=!open}
 trigger.addEventListener('click',()=>{const open=desktop.matches?!pinned:panel.hidden;setOpen(open);pinned=open});
 menu.addEventListener('mouseenter',()=>{if(desktop.matches)setOpen(true)});
 menu.addEventListener('mouseleave',()=>{if(desktop.matches&&!pinned)closeTimer=setTimeout(()=>{if(!menu.contains(document.activeElement))setOpen(false)},150)});
 trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);panel.querySelector('a').focus()}});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopPropagation();setOpen(false);trigger.focus()}});
 menu.addEventListener('focusout',e=>{if(!menu.contains(e.relatedTarget))setOpen(false)});
 document.addEventListener('click',e=>{if(!menu.contains(e.target))setOpen(false)});
 panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
 document.querySelector('.menu')?.addEventListener('click',()=>setOpen(false));
 matchMedia('(max-width:760px)').addEventListener('change',()=>setOpen(false));
})();
