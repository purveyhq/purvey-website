const prices={monthly:{starter:3500,growth:10000,period:'/month',months:1},quarterly:{starter:9500,growth:27000,period:'/quarter',months:3},yearly:{starter:35000,growth:100000,period:'/year',months:12}};
const formatPrice=n=>'₦'+n.toLocaleString('en-NG');
function billingSavings(plan,billing){return prices.monthly[plan]*prices[billing].months-prices[billing][plan]}
function updateBilling(billing){
  const selected=prices[billing];
  if(!selected)return;
  // Includes the compact sticky header, which shares these data attributes.
  document.querySelectorAll('[data-price]').forEach(el=>{el.textContent=formatPrice(selected[el.dataset.price])});
  document.querySelectorAll('[data-price-period]').forEach(el=>{el.textContent=selected.period});
  document.querySelectorAll('[data-savings]').forEach(el=>{
    const saving=billingSavings(el.dataset.savings,billing);
    el.hidden=billing==='monthly'||saving<=0;
    el.querySelector('.savings-badge').textContent=el.hidden?'':'Save '+formatPrice(saving);
  });
  const savings=billing==='monthly'?'':' Compared with monthly billing: Starter saves '+formatPrice(billingSavings('starter',billing))+'; Growth saves '+formatPrice(billingSavings('growth',billing))+'.';
  document.querySelector('#billing-status').textContent=billing+' billing: Starter '+formatPrice(selected.starter)+selected.period+', Growth '+formatPrice(selected.growth)+selected.period+'. Free remains ₦0.'+savings;
  scheduleHeaderUpdate();
}
document.querySelectorAll('input[name="billing"]').forEach(input=>input.addEventListener('change',()=>updateBilling(input.value)));
const menu=document.querySelector('.menu'),nav=document.querySelector('nav'),mobileMenu=window.matchMedia('(max-width: 760px)');
function setMenu(open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.inert=mobileMenu.matches&&!open}
menu.addEventListener('click',()=>setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus()}});
document.addEventListener('click',e=>{if(mobileMenu.matches&&!nav.contains(e.target)&&!menu.contains(e.target))setMenu(false)});
mobileMenu.addEventListener('change',()=>setMenu(false));setMenu(false);
const legalDialog=document.querySelector('#legal-dialog');
document.querySelectorAll('[data-legal]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#legal-heading').textContent=b.dataset.legal;legalDialog.showModal()}));
document.querySelector('.close-legal').addEventListener('click',()=>legalDialog.close());
document.querySelector('#legal-done').addEventListener('click',()=>legalDialog.close());

// A compact header outside the horizontal overflow container follows page
// scrolling. It mirrors the real header, preserving the semantic table below.
const comparisonScroller=document.querySelector('.comparison-scroll');
const comparisonTable=document.querySelector('.pricing-table');
const floatingHeader=document.createElement('div');
floatingHeader.className='pricing-floating-header';
floatingHeader.setAttribute('aria-hidden','true');
floatingHeader.inert=true;
floatingHeader.hidden=true;
const headerTable=document.createElement('table');
headerTable.className='pricing-table';
headerTable.append(comparisonTable.querySelector('colgroup').cloneNode(true));
headerTable.append(comparisonTable.querySelector('thead').cloneNode(true));
headerTable.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
floatingHeader.append(headerTable);
document.body.append(floatingHeader);
let headerFrame=0;
function updateComparisonHeader(){
  headerFrame=0;
  const bounds=comparisonScroller.getBoundingClientRect();
  const navBottom=Math.max(0,document.querySelector('header').getBoundingClientRect().bottom);
  const realHeader=comparisonTable.querySelector('thead').getBoundingClientRect();
  const active=realHeader.top<=navBottom && bounds.bottom>navBottom;
  floatingHeader.hidden=!active;
  if(!active)return;
  floatingHeader.style.left=bounds.left+'px';
  floatingHeader.style.width=bounds.width+'px';
  headerTable.style.width=comparisonTable.getBoundingClientRect().width+'px';
  // Exact measured widths also cover zoom, fonts and responsive breakpoints.
  const realCells=[...comparisonTable.querySelectorAll('thead th')];
  [...headerTable.querySelectorAll('col')].forEach((col,i)=>{
    col.style.width=realCells[i].getBoundingClientRect().width+'px';
  });
  floatingHeader.scrollLeft=comparisonScroller.scrollLeft;
  const height=floatingHeader.getBoundingClientRect().height;
  floatingHeader.style.top=Math.min(navBottom,bounds.bottom-height)+'px';
}
function scheduleHeaderUpdate(){if(!headerFrame)headerFrame=requestAnimationFrame(updateComparisonHeader)}
comparisonScroller.addEventListener('scroll',scheduleHeaderUpdate,{passive:true});
window.addEventListener('scroll',scheduleHeaderUpdate,{passive:true});
window.addEventListener('resize',scheduleHeaderUpdate);

if('ResizeObserver' in window){
  const observer=new ResizeObserver(scheduleHeaderUpdate);
  observer.observe(comparisonScroller);
  observer.observe(document.querySelector('header'));
}
document.fonts.ready.then(scheduleHeaderUpdate);
window.addEventListener('pageshow',()=>updateBilling(document.querySelector('input[name="billing"]:checked').value));
updateBilling(document.querySelector('input[name="billing"]:checked').value);
