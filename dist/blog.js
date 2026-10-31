(() => {
 const search = document.querySelector('#blog-search');
 const filters = [...document.querySelectorAll('[data-filter]')];
 let category = new URLSearchParams(location.search).get('category') || 'All articles';
 if (!filters.some(b => b.dataset.filter === category)) category='All articles';
 function render() {
  const query=search.value.trim().toLowerCase();
  let count=0;
  document.querySelectorAll('.browse .blog-card').forEach(card=>{
   const visible=(category==='All articles'||card.dataset.category===category)&&(!query||card.dataset.search.includes(query));
   card.hidden=!visible;if(visible)count++;
  });
  filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
  document.querySelector('.blog-empty').hidden=count>0;
  document.querySelector('#result-count').textContent=`${count} ${count===1?'article':'articles'} found`;
 }
 if(search){search.addEventListener('input',render);filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;render()}));document.querySelector('#reset-search').addEventListener('click',()=>{category='All articles';search.value='';render();search.focus()});render()}
 const shareURL=document.querySelector('link[rel=canonical]')?.href || location.href.split('#')[0];
 const title=document.querySelector('h1')?.textContent || document.title;
 const targets={
  x:'https://twitter.com/intent/tweet?text='+encodeURIComponent(title)+'&url='+encodeURIComponent(shareURL),
  facebook:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(shareURL),
  linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(shareURL)
 };
 document.querySelectorAll('[data-share]').forEach(a=>{a.href=targets[a.dataset.share]});
 const article=document.querySelector('.article-body');
 const progress=document.querySelector('.reading-progress-fill');
 if(article&&progress){
  const lead=article.querySelector('.article-lead');
  const sections=[...article.querySelectorAll('section')];
  const content=article.querySelector('[data-article-content]');
  const readable=content?[content]:[lead,...sections].filter(Boolean);
  if(!content){
  const words=(readable.map(el=>el.textContent).join(' ').match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length;
  const minutes=Math.max(1,Math.ceil(words/200));
  document.querySelectorAll('[data-article-reading-time]').forEach(el=>el.textContent=minutes+' min read');
  }
  const end=content||sections.at(-1)||article;
  let queued=false;
  function measure(){
   queued=false;
   const headerHeight=document.querySelector('header').getBoundingClientRect().height;
   const startY=(lead||article).getBoundingClientRect().top+scrollY-headerHeight;
   const endY=end.getBoundingClientRect().bottom+scrollY-headerHeight;
   const range=endY-startY;
   const fraction=range>0?(scrollY-startY)/range:(scrollY>=startY?1:0);
   progress.style.transform='scaleX('+Math.min(1,Math.max(0,fraction))+')';
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(measure)}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('pageshow',schedule);
  document.fonts?.ready.then(schedule);
  document.querySelectorAll('.article-cover img').forEach(img=>img.addEventListener('load',schedule,{once:true}));
  new ResizeObserver(schedule).observe(article);
  measure();
 }
 document.querySelector('[data-copy-link]')?.addEventListener('click',async(event)=>{
  const status=document.querySelector('.copy-status');
  const button=event.currentTarget;
  const url=shareURL;
  let copied=false;
  try{await navigator.clipboard.writeText(url);copied=true}catch{
   const field=document.createElement('textarea');
   field.value=url;field.setAttribute('readonly','');field.style.cssText='position:fixed;top:0;left:-9999px';
   document.body.append(field);field.select();
   try{copied=document.execCommand('copy')}catch{}
   field.remove();button.focus();
  }
  status.textContent=copied?'Link copied.':'Copy the article URL from your address bar.';
 });
 if(matchMedia('(max-width:760px)').matches)document.querySelector('.article-sidebar details')?.removeAttribute('open');
 if('IntersectionObserver' in window){const links=[...document.querySelectorAll('.article-sidebar nav a')];const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('current',a.hash==='#'+e.target.id))})},{rootMargin:'-15% 0px -65% 0px'});document.querySelectorAll('.article-body section,[data-toc-heading]').forEach(s=>io.observe(s))}
})();
