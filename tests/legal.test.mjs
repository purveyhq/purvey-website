import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {renderLegalPage, writeLegalPages} from '../scripts/legal-render.mjs';

const root = new URL('../', import.meta.url);
const template = await readFile(new URL('templates/legal-page.html', root), 'utf8');
const terms = JSON.parse(await readFile(new URL('content/legal/terms.json', root), 'utf8'));
const privacy = JSON.parse(await readFile(new URL('content/legal/privacy.json', root), 'utf8'));

test('review documents remain distinct from approved public policy pages', () => {
  for (const document of [terms, privacy]) {
    const draft = renderLegalPage(template, {...document, status: 'draft'});
    assert.match(draft, /noindex,nofollow/);
    assert.match(draft, /Review copy/);
    assert.doesNotMatch(draft, /\{\{[A-Z_]+\}\}|data-legal=|id="legal-dialog"/);
    for (const section of document.sections) {
      assert.ok(draft.includes(`href="#${section.id}"`));
      assert.ok(draft.includes(`id="${section.id}"`));
    }
    const approved = renderLegalPage(template, {...document, status: 'approved'});
    assert.match(approved, /content="index,follow"/);
    assert.doesNotMatch(approved, /Review copy/);
  }
});

test('only approved document URLs are offered to the sitemap builder', async () => {
  const folder = await mkdtemp(path.join(tmpdir(), 'purvey-legal-'));
  try {
    await mkdir(path.join(folder, 'templates'), {recursive: true});
    await mkdir(path.join(folder, 'content/legal'), {recursive: true});
    await writeFile(path.join(folder, 'templates/legal-page.html'), template);
    await writeFile(path.join(folder, 'content/legal/terms.json'), JSON.stringify({...terms, status: 'draft'}));
    await writeFile(path.join(folder, 'content/legal/privacy.json'), JSON.stringify({...privacy, status: 'draft'}));
    assert.deepEqual(await writeLegalPages(folder, path.join(folder, 'output')), []);
    await writeFile(path.join(folder, 'content/legal/terms.json'), JSON.stringify({...terms, status: 'approved'}));
    assert.deepEqual(await writeLegalPages(folder, path.join(folder, 'output')), ['/terms/']);
    assert.match(await readFile(path.join(folder, 'output/privacy-policy/index.html'), 'utf8'), /Review copy/);
  } finally {
    await rm(folder, {recursive: true, force: true});
  }
});
