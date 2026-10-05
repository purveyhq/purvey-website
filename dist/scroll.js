(() => {
  const root = document.documentElement;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let glideFrame = 0;
  let glideTarget = window.scrollY;
  let lastFrameTime = 0;

  const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const clamp = value => Math.max(0, Math.min(maxScroll(), value));
  function stopGlide() {
    if (glideFrame) cancelAnimationFrame(glideFrame);
    glideFrame = 0;
    lastFrameTime = 0;
    glideTarget = window.scrollY;
    root.classList.remove('page-glide-active');
  }
  function hasOwnScroll(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest('dialog[open], textarea, select, [contenteditable="true"]')) return true;
    for (let element = target; element && element !== document.body && element !== root; element = element.parentElement) {
      const style = getComputedStyle(element);
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1) return true;
    }
    return false;
  }
  function glide(now) {
    if (motionPreference.matches) { stopGlide(); return; }
    glideTarget = clamp(glideTarget);
    const elapsed = lastFrameTime ? Math.min(48, now - lastFrameTime) : 16.7;
    lastFrameTime = now;
    const remaining = glideTarget - window.scrollY;
    if (Math.abs(remaining) < 0.7) {
      window.scrollTo(0, glideTarget);
      stopGlide();
      return;
    }
    const easing = 1 - Math.exp(-elapsed / 105);
    window.scrollTo(0, window.scrollY + remaining * easing);
    glideFrame = requestAnimationFrame(glide);
  }
  window.addEventListener('wheel', event => {
    if (motionPreference.matches || event.ctrlKey || !event.cancelable ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY || hasOwnScroll(event.target)) return;
    if (typeof cancelSoftScroll === 'function') cancelSoftScroll();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight * 0.9 : 1;
    if (!glideFrame) glideTarget = window.scrollY;
    const nextTarget = clamp(glideTarget + event.deltaY * unit);
    if (!glideFrame && Math.abs(nextTarget - window.scrollY) < 0.7) return;
    event.preventDefault();
    glideTarget = nextTarget;
    root.classList.add('page-glide-active');
    if (!glideFrame) glideFrame = requestAnimationFrame(glide);
  }, { passive: false });

  // Touch, keyboard, scrollbar and link interactions take over immediately.
  window.addEventListener('touchstart', stopGlide, { passive: true });
  window.addEventListener('pointerdown', stopGlide, { passive: true });
  window.addEventListener('resize', stopGlide, { passive: true });
  document.addEventListener('click', stopGlide);
  document.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape', ' '].includes(event.key)) stopGlide();
  });
  motionPreference.addEventListener('change', stopGlide);
})();
