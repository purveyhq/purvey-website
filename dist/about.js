(() => {
 const menu=document.querySelector('.menu'),nav=document.querySelector('#main-navigation');
 const mobile=matchMedia('(max-width:760px)');
 function setMenu(open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.inert=mobile.matches&&!open}
 menu.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
 nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus()}});
 document.addEventListener('click',event=>{if(mobile.matches&&!nav.contains(event.target)&&!menu.contains(event.target))setMenu(false)});
 mobile.addEventListener('change',()=>setMenu(false));setMenu(false);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const targets=[...document.querySelectorAll('.about-reveal')];
 if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('is-waiting');observer.unobserve(entry.target)}}),{threshold:.08});targets.forEach(target=>{target.classList.add('is-waiting');observer.observe(target)})}
 reduced.addEventListener('change',()=>{if(reduced.matches)targets.forEach(target=>target.classList.remove('is-waiting'))});
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-offscreen',!entry.isIntersecting)));document.querySelectorAll('.btn').forEach(button=>observer.observe(button))}
})();
