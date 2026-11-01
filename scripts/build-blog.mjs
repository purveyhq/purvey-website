import {cp, mkdir, readFile, rm, writeFile, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createClient} from '@sanity/client';
import {sanityConfig, postsQuery, siteURL} from './blog-config.mjs';
import {validatePosts, renderListing, renderArticle, articleURL, esc} from './blog-render.mjs';
import {writeLegalPages} from './legal-render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtureArg = process.argv.find((arg) => arg.startsWith('--fixture='));
const preview = Boolean(fixtureArg);
if (preview && process.env.VERCEL) throw new Error('Local fixtures must never be used in a Vercel build.');
const output = path.join(root, preview ? '.preview' : 'build');
const staging = output + '-tmp';
await rm(staging, {recursive: true, force: true});

try {
  const rawPosts = preview ? JSON.parse(await readFile(path.resolve(root, fixtureArg.slice('--fixture='.length)), 'utf8')) :
    await createClient({...sanityConfig, token: process.env.SANITY_READ_TOKEN, timeout: 30000, maxRetries: 2}).fetch(postsQuery);
  const posts = validatePosts(rawPosts);
  const previewImages = new Map(preview ? posts.filter((post) => /^\/assets\/blog\/[a-z0-9-]+\.(svg|jpg|webp)$/.test(post._localPreviewImage || '')).map((post) => [post.coverImage.asset._ref.slice(6).replace(/-(jpg|png|webp)$/, '.$1'), post._localPreviewImage]) : []);
  // Local layout fixtures use the existing editorial artwork. This path is
  // disabled in production and does not create or publish Sanity content.
  const localArtwork = (html) => preview ? html.replace(/https:\/\/cdn\.sanity\.io\/images\/[^/]+\/[^/]+\/([^?"\s]+)\?[^"\s]+/g, (url, asset) => previewImages.get(asset) || url) : html;
  const [listTemplate, articleTemplate, originalSitemap] = await Promise.all([
    readFile(path.join(root, 'templates/blog-list.html'), 'utf8'),
    readFile(path.join(root, 'templates/blog-article.html'), 'utf8'),
    readFile(path.join(root, 'dist/sitemap.xml'), 'utf8'),
  ]);
  // Render everything before touching the previous successful build.
  const listing = localArtwork(renderListing(listTemplate, posts, preview));
  const articles = posts.map((post) => ({post, html: localArtwork(renderArticle(articleTemplate, post, posts, preview))}));
  await cp(path.join(root, 'dist'), staging, {recursive: true, filter: (source) => source !== path.join(root, 'dist/blog')});
  const legalURLs = await writeLegalPages(root, staging);
  await mkdir(path.join(staging, 'blog'), {recursive: true});
  await writeFile(path.join(staging, 'blog/index.html'), listing);
  for (const {post, html} of articles) {
    const folder = path.join(staging, 'blog', post.slug);
    await mkdir(folder, {recursive: true});
    await writeFile(path.join(folder, 'index.html'), html);
  }
  const baseEntries = [...originalSitemap.matchAll(/<url>.*?<loc>(.*?)<\/loc>.*?<\/url>/gs)].filter((m) => { const pathname = new URL(m[1]).pathname; return !pathname.startsWith('/blog/') && !['/terms/', '/privacy-policy/'].includes(pathname); }).map((m) => m[0]);
  const entries = [`<url><loc>${siteURL}/blog/</loc></url>`, ...legalURLs.map((url) => `<url><loc>${siteURL}${url}</loc></url>`), ...posts.map((p) => `<url><loc>${siteURL}${articleURL(p)}</loc><lastmod>${esc(p._updatedAt || p.publishedAt)}</lastmod></url>`)];
  await writeFile(path.join(staging, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...baseEntries, ...entries].join('\n')}\n</urlset>\n`);
  if (preview) await writeFile(path.join(staging, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  await rm(output, {recursive: true, force: true});
  await rename(staging, output);
  console.log(`Built ${posts.length} ${preview ? 'local preview' : 'published Sanity'} articles → ${path.relative(root, output)}/`);
} catch (error) {
  await rm(staging, {recursive: true, force: true});
  // Never print an SDK error object: its request config could contain a token.
  console.error(`Blog build failed. ${error.statusCode ? `Sanity HTTP ${error.statusCode}. Check dataset visibility and the read token.` : error.message?.startsWith('Post ') ? error.message : 'Check Sanity connectivity, published content and templates.'} The previous build was preserved.`);
  process.exitCode = 1;
}
