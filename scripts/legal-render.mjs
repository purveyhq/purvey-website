import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {esc, fill} from './blog-render.mjs';
import {siteURL} from './blog-config.mjs';

export function renderLegalPage(template, document) {
  const draft = document.status !== 'approved';
  const title = `${document.title} | Purvey`;
  const canonical = siteURL + document.path;
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(document.description)}"><meta name="robots" content="${draft ? 'noindex,nofollow' : 'index,follow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Purvey"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(document.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${siteURL}/assets/purvey-social-icon.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(document.description)}"><meta name="twitter:image" content="${siteURL}/assets/purvey-social-icon.png"><link rel="icon" href="/favicon.svg"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/navigation.css"><link rel="stylesheet" href="/legal.css"><link rel="stylesheet" href="/cookie-consent.css">`;
  const formattedDate = new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos'}).format(new Date(document.updated));
  return fill(template, {
    HEAD: head,
    REVIEW_NOTE: draft ? '<div class="legal-review-note" role="note">Review copy · Prepared for owner and legal review. Not published.</div>' : '',
    TITLE: esc(document.title), INTRO: esc(document.intro),
    DATE_LABEL: draft ? 'Prepared' : 'Last updated', DATE_ISO: document.updated, DATE_TEXT: formattedDate,
    CONTENTS: document.sections.map((section) => `<a href="#${section.id}">${esc(section.title)}</a>`).join(''),
    // Local, reviewed policy source only; never CMS-supplied HTML.
    SECTIONS: document.sections.map((section) => `<section id="${section.id}"><h2>${esc(section.title)}</h2>${section.body}</section>`).join(''),
  });
}

export async function writeLegalPages(root, output) {
  const template = await readFile(path.join(root, 'templates/legal-page.html'), 'utf8');
  const approvedURLs = [];
  for (const name of ['terms', 'privacy']) {
    const document = JSON.parse(await readFile(path.join(root, `content/legal/${name}.json`), 'utf8'));
    if (!['/terms/', '/privacy-policy/'].includes(document.path)) throw new Error('Unexpected legal document path');
    const folder = path.join(output, document.path);
    await mkdir(folder, {recursive: true});
    await writeFile(path.join(folder, 'index.html'), renderLegalPage(template, document));
    if (document.status === 'approved') approvedURLs.push(document.path);
  }
  return approvedURLs;
}
