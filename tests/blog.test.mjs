import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {validatePosts, renderBody, renderListing, renderArticle, readingMinutes, safeLink, imageURL, authorAvatar} from '../scripts/blog-render.mjs';
import {postsQuery, sanityConfig} from '../scripts/blog-config.mjs';

const fixtures = JSON.parse(await readFile(new URL('./fixtures/posts.json', import.meta.url), 'utf8'));
const listing = await readFile(new URL('../templates/blog-list.html', import.meta.url), 'utf8');
const article = await readFile(new URL('../templates/blog-article.html', import.meta.url), 'utf8');
const posts = validatePosts(fixtures);
const block = (text, extra = {}) => ({_type: 'block', _key: 'test', style: 'normal', markDefs: [], children: [{_type: 'span', text, marks: []}], ...extra});

test('published-only fetching and document validation protect public output', () => {
  assert.equal(sanityConfig.perspective, 'published');
  assert.equal(sanityConfig.useCdn, false);
  assert.match(postsQuery, /drafts/);
  assert.match(postsQuery, /versions/);
  assert.equal(validatePosts([...fixtures, {...fixtures[0], _id: 'drafts.private'}]).length, fixtures.length);
  for (const slug of ['../pricing', 'bad/slug', 'bad slug', 'Blog', 'a'.repeat(97)]) {
    assert.throws(() => validatePosts([{...fixtures[0], slug}]), /slug/);
  }
  assert.throws(() => validatePosts([fixtures[0], fixtures[0]]), /duplicate/);
  assert.throws(() => validatePosts([{...fixtures[0], body: []}]), /article text/);
  assert.throws(() => validatePosts([{...fixtures[0], coverImage: {...fixtures[0].coverImage, alt: ''}}]), /alt text/);
});

test('reading time is derived from full text, excluding image captions and UI', () => {
  assert.equal(readingMinutes([block('word '.repeat(200))]), 1);
  assert.equal(readingMinutes([block('word '.repeat(201))]), 2);
  assert.equal(readingMinutes([block('word '.repeat(600)), {_type: 'image', caption: 'word '.repeat(300)}]), 3);
});

test('rich text preserves headings, nested lists, marks and images safely', () => {
  const value = [
    block('<script>unsafe</script>'),
    block('Heading', {style: 'h2', _key: 'h'}),
    block('Item', {listItem: 'bullet', level: 1}),
    block('Nested', {listItem: 'bullet', level: 2}),
    block('Linked', {markDefs: [{_key: 'l', _type: 'link', href: 'javascript:alert(1)'}], children: [{_type: 'span', text: 'Linked', marks: ['l', 'strong']}]}),
    {_type: 'image', ...fixtures[0].coverImage, caption: '<b>Caption</b>'},
  ];
  const {html, toc} = renderBody(value);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /javascript:|<script>/);
  assert.match(html, /<strong>Linked<\/strong>/);
  assert.equal((html.match(/<ul>/g) || []).length, 2);
  assert.match(html, /<h2 id="section-1"/);
  assert.equal(toc[0].id, 'section-1');
  assert.match(html, /&lt;b&gt;Caption&lt;\/b&gt;/);
  assert.throws(() => renderBody([{_type: 'unimplemented'}]));
  for (const href of ['javascript:alert(1)', 'data:text/html,evil', '//evil.example', '/\\evil', 'java\nscript:x']) assert.equal(safeLink(href), null);
  for (const href of ['https://example.com/?a=1&b=2', '/about/', '#heading', 'mailto:hi@example.com']) assert.equal(safeLink(href), href);
});

test('image URL builder respects editorial cropping and requests responsive sizes', () => {
  const image = {...fixtures[0].coverImage, crop: {left: 0.1, right: 0.1, top: 0, bottom: 0}, hotspot: {x: 0.8, y: 0.5, width: 0.1, height: 0.1}};
  const url = imageURL(image, 740, 480);
  assert.match(url, /w=740/);
  assert.match(url, /h=480/);
  assert.match(url, /rect=/);
});

test('CMS fields are escaped in titles, filters, captions and metadata', () => {
  const hostile = {...posts[0], title: '<img src=x onerror=alert(1)>', excerpt: '" onmouseover="alert(1)', category: '"><script>bad</script>', seoDescription: '</script><script>bad</script>'};
  const html = renderArticle(article, hostile, [hostile]);
  assert.doesNotMatch(html, /<script>bad<\/script>|<img src=x/);
  assert.match(html, /\\u003c\/script>/);
  const list = renderListing(listing, [hostile]);
  assert.doesNotMatch(list, /<script>bad<\/script>/);
  assert.doesNotMatch(list, /\{\{[A-Z_]+\}\}/);
});

test('article pages have initial content, calculated reading time, sharing and SEO', () => {
  const html = renderArticle(article, posts[0], posts);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /data-article-content/);
  assert.match(html, /data-share="x"/);
  assert.match(html, /data-share="facebook"/);
  assert.match(html, /data-share="linkedin"/);
  assert.match(html, /reading-progress-fill/);
  assert.match(html, /<strong>PurveyHq<\/strong>/);
  assert.match(html, new RegExp(`${posts[0].minutes} min read`));
  assert.doesNotMatch(html, /Design preview|Purvey Team|\{\{[A-Z_]+\}\}/);
  assert.ok(html.includes('cookie-consent.js'));
});

test('empty and single-post blogs work without fictional fallback cards or dead related links', () => {
  const empty = renderListing(listing, []);
  assert.match(empty, /Your next read is on its way/);
  assert.doesNotMatch(empty, /class="blog-card"|Design preview/);
  assert.equal((empty.match(/data-filter=/g) || []).length, 1);
  const single = renderArticle(article, posts[0], [posts[0]]);
  assert.doesNotMatch(single, /class="related"/);
  const noHeadings = {...posts[0], body: [block('Short article.')]};
  assert.match(renderArticle(article, noHeadings, [noHeadings]), /<details open hidden>/);
});

test('published author names appear in listing, related cards, byline and SEO without markup injection', () => {
  assert.match(postsQuery, /\bauthor\b/);
  const named = {...posts[0], author: '  Lanre Malumi  '};
  const other = {...posts[1], author: 'Another writer'};
  const html = renderArticle(article, named, [named, other]);
  assert.equal((html.match(/<strong>Lanre Malumi<\/strong>/g) || []).length, 2);
  assert.match(html, /"author":\{"@type":"Person","name":"Lanre Malumi"\}/);
  assert.match(html, /class="author-mark" aria-hidden="true">L<\/span>/);
  assert.match(html, /class="blog-author">Another writer<\/span>/);
  assert.match(renderListing(listing, [named]), /class="blog-author">Lanre Malumi<\/span>/);
  assert.match(renderArticle(article, {...named, author: 'Purvey Team'}, []), /"author":\{"@type":"Organization","name":"Purvey Team"/);
  for (const author of [undefined, null, '', '   ']) {
    assert.match(renderArticle(article, {...named, author}, []), /<strong>PurveyHq<\/strong>/);
  }
  const unsafe = {...named, author: '<script>alert(1)</script>'};
  const escaped = renderArticle(article, unsafe, []);
  assert.doesNotMatch(escaped, /<script>alert\(1\)<\/script>/);
  assert.match(escaped, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('optional author portraits use cropped responsive images and retain an accessible initial fallback', () => {
  assert.match(postsQuery, /\bauthorImage\b/);
  const named = {...posts[0], author: 'Lanre Malumi'};
  const fallback = authorAvatar(named);
  assert.match(fallback, /aria-hidden="true">L<\/span>/);
  assert.doesNotMatch(fallback, /<img/);
  assert.equal(authorAvatar({...named, authorImage: null}), fallback);
  assert.equal(authorAvatar({...named, authorImage: {asset: {_ref: 'invalid'}}}), fallback);
  const withPhoto = {...named, authorImage: {...named.coverImage, hotspot: {x: 0.7, y: 0.3, width: 0.2, height: 0.2}, crop: {left: 0.1, right: 0.1, top: 0, bottom: 0}}};
  const portrait = authorAvatar(withPhoto);
  assert.match(portrait, /data-author-avatar/);
  assert.match(portrait, /w=74/);
  assert.match(portrait, /h=74/);
  assert.match(portrait, /w=148/);
  assert.match(portrait, /rect=/);
  assert.match(portrait, /alt="" width="37" height="37"/);
  assert.match(renderArticle(article, withPhoto, []), /<strong>Lanre Malumi<\/strong>/);
});

test('full fixture build removes stale articles, preserves previous output on failure and is blocked on Vercel', async () => {
  const cwd = new URL('../', import.meta.url);
  const env = {...process.env};
  delete env.VERCEL;
  const run = (file = 'tests/fixtures/posts.json', extraEnv = {}) => spawnSync(process.execPath, ['scripts/build-blog.mjs', `--fixture=${file}`], {cwd, env: {...env, ...extraEnv}, encoding: 'utf8'});
  assert.equal(run().status, 0);
  const generated = await readFile(new URL('../.preview/blog/index.html', import.meta.url), 'utf8');
  assert.match(generated, /noindex,nofollow/);
  assert.equal((generated.match(/class="blog-card"/g) || []).length, posts.length);
  await writeFile(new URL('../.preview/previous-build', import.meta.url), 'keep');
  const bad = new URL('./fixtures/invalid.tmp.json', import.meta.url);
  const empty = new URL('./fixtures/empty.tmp.json', import.meta.url);
  try {
    await writeFile(bad, JSON.stringify([{...fixtures[0], slug: '../escape'}]));
    assert.notEqual(run('tests/fixtures/invalid.tmp.json').status, 0);
    assert.equal(await readFile(new URL('../.preview/previous-build', import.meta.url), 'utf8'), 'keep');
    assert.notEqual(run(undefined, {VERCEL: '1'}).status, 0);
    await writeFile(empty, '[]');
    assert.equal(run('tests/fixtures/empty.tmp.json').status, 0);
    await assert.rejects(readFile(new URL(`../.preview/blog/${posts[0].slug}/index.html`, import.meta.url)));
  } finally {
    await rm(bad, {force: true});
    await rm(empty, {force: true});
  }
});
