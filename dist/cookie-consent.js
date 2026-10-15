/* Shared consent controls for Purvey's public marketing pages. No tracking tags load here. */
(() => {
  'use strict';
  const KEY = 'purvey.cookie-consent.v1';
  const VERSION = 1;
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const empty = () => ({ necessary: true, analytics: false, marketing: false });
  const valid = value => value && value.version === VERSION &&
    typeof value.analytics === 'boolean' && typeof value.marketing === 'boolean' &&
    Number.isFinite(value.savedAt) && value.savedAt <= Date.now() && Date.now() - value.savedAt < MAX_AGE;
  function read() {
    try { const value = JSON.parse(localStorage.getItem(KEY)); return valid(value) ? value : null; }
    catch { return null; }
  }
  let saved = read();
  const current = () => saved && valid(saved) ? { ...saved, necessary: true } : empty();
  // Future tags must check allows() BEFORE loading and honour withdrawal events.
  window.PurveyConsent = Object.freeze({
    get: () => ({ ...current() }),
    allows: category => ['analytics', 'marketing'].includes(category) && current()[category] === true,
    open: () => openPreferences()
  });
  function notify() {
    window.dispatchEvent(new CustomEvent('purvey:consent-change', { detail: { ...current() } }));
  }
  const host = document.createElement('div');
  host.id = 'purvey-cookie-controls';
  host.innerHTML = `
    <section class="cookie-banner" aria-labelledby="cookie-title" hidden>
      <span class="cookie-eyebrow">A little about cookies</span>
      <h2 id="cookie-title">Your privacy, your choice.</h2>
      <p>We remember your cookie choices. With your permission, we’d also like to measure visits and show you relevant Purvey ads.</p>
      <div class="cookie-actions">
        <button type="button" class="cookie-button cookie-accept" data-cookie-choice="all">Accept all</button>
        <button type="button" class="cookie-button cookie-reject" data-cookie-choice="none">Reject optional</button>
        <button type="button" class="cookie-preferences">Preferences</button>
      </div>
    </section>
    <dialog class="cookie-dialog" aria-labelledby="cookie-settings-title" aria-describedby="cookie-settings-description">
      <div class="cookie-dialog-heading"><span class="cookie-eyebrow">You’re in control</span><button type="button" class="cookie-close" aria-label="Close cookie preferences">×</button></div>
      <h2 id="cookie-settings-title">Cookie preferences</h2>
      <p id="cookie-settings-description">Choose what you’re comfortable with. You can change your mind any time using Cookie settings in the footer.</p>
      <div class="cookie-category"><div><h3>Essential storage</h3><p>Remembers your privacy choices so we don’t ask on every page. Always on.</p></div><span class="cookie-always">Always on</span></div>
      <label class="cookie-category" for="cookie-analytics"><div><h3>Analytics</h3><p>Allows optional tools that help us understand visits and improve the website.</p></div><input id="cookie-analytics" type="checkbox" role="switch"><span class="cookie-switch" aria-hidden="true"></span></label>
      <label class="cookie-category" for="cookie-marketing"><div><h3>Marketing</h3><p>Allows advertising tools to help show relevant Purvey ads on other platforms and measure their results.</p></div><input id="cookie-marketing" type="checkbox" role="switch"><span class="cookie-switch" aria-hidden="true"></span></label>
      <details class="cookie-details"><summary>How your choices are used</summary><p>Your choice is stored in this browser for up to six months. Rejecting optional storage won’t stop you browsing. These settings cover Purvey’s marketing website. No optional analytics or advertising tools are currently connected; accepting does not start ads or tracking on its own.</p><p>Reopen these settings to withdraw permission. Withdrawal stops future optional tracking; it does not undo data already sent while you had agreed.</p></details>
      <div class="cookie-dialog-actions"><button type="button" class="cookie-button cookie-reject" data-cookie-choice="none">Reject optional</button><button type="button" class="cookie-button cookie-accept" id="cookie-save">Save preferences</button></div>
    </dialog>
    <span class="sr-only" role="status" aria-live="polite" id="cookie-status"></span>`;
  document.body.append(host);
  const banner = host.querySelector('.cookie-banner');
  const dialog = host.querySelector('.cookie-dialog');
  const analytics = host.querySelector('#cookie-analytics');
  const marketing = host.querySelector('#cookie-marketing');
  const status = host.querySelector('#cookie-status');
  let opener;
  const footer = document.querySelector('.legal-links');
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'cookie-footer-link';
  settings.textContent = 'Cookie settings';
  settings.addEventListener('click', openPreferences);
  if (footer) footer.append(settings);
  else { settings.classList.add('cookie-settings-fallback'); document.body.append(settings); }
  function openPreferences() {
    if (dialog.open) return;
    opener = document.activeElement;
    const consent = current();
    analytics.checked = consent.analytics;
    marketing.checked = consent.marketing;
    dialog.showModal();
  }
  function save(allowAnalytics, allowMarketing) {
    saved = { version: VERSION, necessary: true, analytics: allowAnalytics, marketing: allowMarketing, savedAt: Date.now() };
    let persisted = true;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { persisted = false; }
    banner.hidden = true;
    const wasModal = dialog.open;
    if (wasModal) dialog.close();
    else if (host.contains(document.activeElement)) settings.focus({ preventScroll: true });
    status.textContent = persisted ? 'Your cookie preferences have been saved.' : 'Your preferences apply to this page. Your browser could not save them for your next visit.';
    notify();
  }
  host.querySelector('.cookie-preferences').addEventListener('click', openPreferences);
  host.querySelector('.cookie-close').addEventListener('click', () => dialog.close());
  host.querySelectorAll('[data-cookie-choice]').forEach(button => button.addEventListener('click', () => {
    const allow = button.dataset.cookieChoice === 'all';
    save(allow, allow);
  }));
  host.querySelector('#cookie-save').addEventListener('click', () => save(analytics.checked, marketing.checked));
  dialog.addEventListener('close', () => {
    if (opener && opener.isConnected && !opener.closest('[hidden]')) opener.focus({ preventScroll: true });
    else settings.focus({ preventScroll: true });
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    saved = read();
    banner.hidden = !!saved;
    analytics.checked = current().analytics;
    marketing.checked = current().marketing;
    notify();
  });
  banner.hidden = !!saved;
  notify();
})();
