const menu=document.querySelector('.menu'),nav=document.querySelector('nav');const mobileMenu=window.matchMedia('(max-width: 760px)');function setMenu(open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.inert=mobileMenu.matches&&!open;}menu.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus()}});document.addEventListener('click',e=>{if(mobileMenu.matches&&!nav.contains(e.target)&&!menu.contains(e.target))setMenu(false)});mobileMenu.addEventListener('change',()=>setMenu(false));setMenu(false);
const dialog=document.querySelector('#plan-dialog');const descriptions={Free:'Start exploring the storefront and core tools for managing your business.',Starter:'Manage up to 150 active products, add 1 staff member and run coupon campaigns. Starts at ₦3,500 per month.',Growth:'Manage up to 1,000 active products, add 5 staff members and access advanced analytics. Starts at ₦10,000 per month.'};document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#plan-heading').textContent='Explore '+b.dataset.plan;document.querySelector('#plan-description').textContent=descriptions[b.dataset.plan];dialog.showModal()}));document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets=document.querySelectorAll('.intro,.tools-heading,.tools-grid article,.social-section,.steps>div,.plans article,.faq,.closing');
if(!reduced.matches&&'IntersectionObserver' in window){revealTargets.forEach((el,i)=>{el.classList.add('reveal');if(el.closest('.tools-grid')||el.closest('.steps'))el.style.transitionDelay=(i%2)*90+'ms'});const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.12});revealTargets.forEach(el=>observer.observe(el));}
const cards=[...document.querySelectorAll('.feature-stack .feature')];
const cardObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('entered');cardObserver.unobserve(e.target)}}),{threshold:.18});cards.forEach(el=>cardObserver.observe(el));
function layoutCards(){const headerHeight=document.querySelector('header').offsetHeight;cards.forEach((card,i)=>{const top=Math.min(headerHeight+14,window.innerHeight-card.offsetHeight-24)+i*8;card.style.setProperty('--card-top',top+'px')});updateStack()}function updateStack(){cards.forEach(card=>{card.style.transform=''})}window.addEventListener('resize',layoutCards);reduced.addEventListener('change',()=>{revealTargets.forEach(el=>el.classList.add('in-view'));cards.forEach(el=>el.classList.add('entered'));layoutCards()});if('ResizeObserver' in window){const sizeObserver=new ResizeObserver(layoutCards);cards.forEach(c=>sizeObserver.observe(c))}document.fonts.ready.then(layoutCards);layoutCards();
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{const panel=document.querySelector('.dashboard-main');panel.classList.remove('view-change');requestAnimationFrame(()=>panel.classList.add('view-change'))}));
const tools=[...document.querySelectorAll('[data-tool]')];
// All illustration images stay mounted and are decoded ahead of tab selection.
const toolViews=new Map(tools.map(btn=>{const view=document.getElementById(btn.getAttribute('aria-controls'));const image=view.querySelector('img');image.loading='eager';if(image.decode)image.decode().catch(()=>{});return [btn.dataset.tool,view]}));
let toolAnimation;
const toolPanel=document.querySelector('#tool-panel');
const tabStrip=document.querySelector('.tools-tabs');
function selectTool(btn,animate=true){
 const previous=tools.findIndex(t=>t.getAttribute('aria-selected')==='true');
 const next=tools.indexOf(btn);
 if(toolAnimation)toolAnimation.cancel();
 tools.forEach(t=>{const active=t===btn;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;toolViews.get(t.dataset.tool).hidden=!active});
 const view=toolViews.get(btn.dataset.tool);
 if(animate&&previous!==next&&!reduced.matches&&view.animate){
  const direction=next>previous?1:-1;
  toolAnimation=view.animate([{opacity:.45,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 const stripBounds=tabStrip.getBoundingClientRect(),buttonBounds=btn.getBoundingClientRect();
 let delta=0;
 if(buttonBounds.left<stripBounds.left+12)delta=buttonBounds.left-stripBounds.left-12;
 else if(buttonBounds.right>stripBounds.right-12)delta=buttonBounds.right-stripBounds.right+12;
 if(delta)tabStrip.scrollBy({left:delta,behavior:animate&&!reduced.matches?'smooth':'instant'});
}
// Pointer selection stays clean; keyboard navigation retains a visible focus indicator.
tabStrip.addEventListener('pointerdown',()=>tabStrip.classList.add('pointer-navigation'));
document.addEventListener('keydown',()=>tabStrip.classList.remove('pointer-navigation'));
tools.forEach((b,i)=>{
 b.addEventListener('click',()=>selectTool(b));
 b.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tools.length;else if(e.key==='ArrowLeft')n=(i+tools.length-1)%tools.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tools.length-1;else return;e.preventDefault();tools[n].focus({preventScroll:true});selectTool(tools[n])});
});
selectTool(tools[0],false);
// A short horizontal touch gesture changes tools without intercepting vertical scrolling.
let toolTouch;
const toolScene=document.querySelector('.tool-scene');
toolScene.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch'||!event.isPrimary)return;toolTouch={x:event.clientX,y:event.clientY,id:event.pointerId}});
toolScene.addEventListener('pointercancel',()=>{toolTouch=null});
toolScene.addEventListener('pointerup',event=>{
 if(!toolTouch||event.pointerId!==toolTouch.id)return;
 const dx=event.clientX-toolTouch.x,dy=event.clientY-toolTouch.y;toolTouch=null;
 if(Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.4)return;
 const index=tools.findIndex(t=>t.getAttribute('aria-selected')==='true');
 const next=index+(dx<0?1:-1);
 if(next>=0&&next<tools.length)selectTool(tools[next]);
});
// Reserve the tallest panel at this width so switching tools never shifts the next section.
function sizeToolPanels(){
 toolPanel.style.removeProperty('--tool-height');
 let height=0;
 toolViews.forEach(view=>{
  const hidden=view.hidden;view.hidden=false;
  view.style.cssText='position:absolute;inset:auto;height:auto;visibility:hidden;width:100%;';
  height=Math.max(height,view.getBoundingClientRect().height);
  view.style.cssText='';view.hidden=hidden;
 });
 toolPanel.style.setProperty('--tool-height',Math.ceil(height)+'px');
}
let toolResizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(toolResizeFrame);toolResizeFrame=requestAnimationFrame(sizeToolPanels)});
document.fonts.ready.then(sizeToolPanels);
reduced.addEventListener('change',()=>{if(reduced.matches&&toolAnimation)toolAnimation.cancel()});
const motionButton=document.querySelector('.motion-toggle');motionButton.addEventListener('click',()=>{const paused=document.querySelector('.testimonials').classList.toggle('paused');motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Resume cards':'Pause cards'});
const legalDialog=document.querySelector('#legal-dialog');document.querySelectorAll('[data-legal]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#legal-heading').textContent=b.dataset.legal;legalDialog.showModal()}));document.querySelector('.close-legal').addEventListener('click',()=>legalDialog.close());document.querySelector('#legal-done').addEventListener('click',()=>legalDialog.close());
let heroVisible=true;const rotatingWords=[...document.querySelectorAll('.rotating-word .word')];let wordIndex=0,wordTimer;function startWordRotation(){clearTimeout(wordTimer);if(reduced.matches){rotatingWords.forEach((w,i)=>{w.classList.toggle('is-active',i===0);w.classList.remove('is-leaving')});wordIndex=0;return}if(document.hidden||!heroVisible)return;wordTimer=setTimeout(()=>{if(!document.hidden){const old=rotatingWords[wordIndex];old.classList.remove('is-active');old.classList.add('is-leaving');wordIndex=(wordIndex+1)%rotatingWords.length;rotatingWords[wordIndex].classList.remove('is-leaving');rotatingWords[wordIndex].classList.add('is-active');setTimeout(()=>old.classList.remove('is-leaving'),650)}startWordRotation()},5500)}reduced.addEventListener('change',startWordRotation);startWordRotation();

document.addEventListener('visibilitychange',()=>startWordRotation());
if('IntersectionObserver' in window){const shineObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('motion-offscreen',!e.isIntersecting)));document.querySelectorAll('.btn').forEach(btn=>shineObserver.observe(btn))}

if('IntersectionObserver' in window){new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;startWordRotation()},{threshold:.1}).observe(document.querySelector('.hero h1'))}

// Gently ease section navigation; wheel and touch scrolling remain native.
let softScrollFrame=0;
function cancelSoftScroll(){if(softScrollFrame)cancelAnimationFrame(softScrollFrame);softScrollFrame=0;document.documentElement.classList.remove('soft-scroll-active')}
function softScrollTo(target,hash){
 cancelSoftScroll();
 const start=window.scrollY;
 const header=document.querySelector('header');
 const end=hash==='#'?0:Math.max(0,target.getBoundingClientRect().top+start-(header?header.offsetHeight:0)-18);
 const destination=Math.min(end,Math.max(0,document.documentElement.scrollHeight-window.innerHeight));
 const distance=destination-start;
 const duration=Math.min(900,Math.max(500,Math.abs(distance)*.22));
 document.documentElement.classList.add('soft-scroll-active');
 const finish=()=>{window.scrollTo(0,destination);cancelSoftScroll();if(target){const hadTabIndex=target.hasAttribute('tabindex');if(!hadTabIndex)target.setAttribute('tabindex','-1');target.focus({preventScroll:true});if(!hadTabIndex)target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true})}};
 if(reduced.matches||Math.abs(distance)<2){finish();return}
 const began=performance.now();
 const tick=now=>{if(reduced.matches){finish();return}const progress=Math.min(1,(now-began)/duration);const eased=1-Math.pow(1-progress,3);window.scrollTo(0,start+distance*eased);if(progress<1)softScrollFrame=requestAnimationFrame(tick);else finish()};
 softScrollFrame=requestAnimationFrame(tick);
}
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href^="#"]');
 if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||anchor.hasAttribute('download')||anchor.target==='_blank')return;
 const hash=anchor.getAttribute('href');let target=null;
 try{target=hash==='#'?document.querySelector('main'):document.getElementById(decodeURIComponent(hash.slice(1)))}catch{return}
 if(!target)return;event.preventDefault();if(location.hash!==hash)history.pushState(null,'',hash);softScrollTo(target,hash);
});
window.addEventListener('wheel',cancelSoftScroll,{passive:true});
window.addEventListener('touchstart',cancelSoftScroll,{passive:true});
document.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End','Escape',' '].includes(event.key))cancelSoftScroll()});
