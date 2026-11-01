(() => {
 const sidebar=document.querySelector('.legal-sidebar details');
 const mobile=matchMedia('(max-width:760px)');
 const setContents=()=>{if(sidebar)sidebar.open=!mobile.matches};
 setContents();mobile.addEventListener('change',setContents);
 document.querySelectorAll('[data-cookie-preferences]').forEach(button=>button.addEventListener('click',()=>window.PurveyConsent?.open()));
 const links=[...document.querySelectorAll('.legal-toc-links a')];
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   links.forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
  }),{rootMargin:'-15% 0px -65% 0px'});
  document.querySelectorAll('.legal-body section').forEach(section=>observer.observe(section));
 }
})();
