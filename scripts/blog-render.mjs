import {toHTML, escapeHTML} from '@portabletext/to-html';
import {createImageUrlBuilder} from '@sanity/image-url';
import {sanityConfig, siteURL} from './blog-config.mjs';

export const esc = (value) => escapeHTML(String(value ?? ''));
const imageBuilder = createImageUrlBuilder(sanityConfig);
export const articleURL = (post) => `/blog/${post.slug}/`;
const words = (text) => text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || [];
export const blockText = (block) => (block.children || []).map((span) => span.text || '').join('');
export const readingMinutes = (body) => Math.max(1, Math.ceil(words(body.filter((b) => b._type === 'block').map(blockText).join(' ')).length / 200));

export function safeLink(href) {
  if (typeof href !== 'string' || /[\u0000-\u0020\\]/u.test(href)) return null;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (/^\/(?!\/)/.test(href) || /^#[\w-]+$/.test(href)) return href;
  return null;
}

export function imageURL(image, width, height) {
  let builder = imageBuilder.image(image).width(width).auto('format').quality(85);
  if (height) builder = builder.height(height).fit('crop');
  return builder.url();
}

export function imageHTML(image, {cover = false, card = false} = {}) {
  const width = card ? 740 : 1400;
  const height = card ? 480 : cover ? 630 : undefined;
  const src = imageURL(image, width, height);
  const sourceHeight = Number(image.asset?._ref?.match(/-(\d+)x(\d+)-/)?.[2]);
  const sourceWidth = Number(image.asset?._ref?.match(/-(\d+)x(\d+)-/)?.[1]);
  const displayHeight = height || Math.round(width * (sourceHeight / sourceWidth || 0.67));
  const sizes = card ? '(max-width:520px) 100vw, (max-width:760px) 50vw, 33vw' : '(max-width:760px) 100vw, 1100px';
  const srcset = [400, 740, 1100, 1400].filter((w) => w <= width).map((w) => `${esc(imageURL(image, w, height ? Math.round(w * height / width) : undefined))} ${w}w`).join(', ');
  return `<img src="${esc(src)}" srcset="${srcset}" sizes="${sizes}" alt="${esc(image.alt)}" width="${width}" height="${displayHeight}" ${cover ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

export function validatePosts(posts) {
  if (!Array.isArray(posts)) throw new Error('Sanity did not return a list of posts.');
  const seen = new Set();
  return posts.filter((p) => !/^(drafts|versions)\./.test(p._id || '')).map((p) => {
    const fail = (message) => { throw new Error(`Post ${p._id || '(no id)'}: ${message}`); };
    for (const field of ['title', 'slug', 'excerpt', 'category', 'publishedAt']) {
      if (typeof p[field] !== 'string' || !p[field].trim()) fail(`missing ${field}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || p.slug.length > 96) fail('use a lowercase, hyphen-separated URL slug (max 96 characters)');
    if (seen.has(p.slug)) fail(`duplicate slug ${p.slug}`);
    seen.add(p.slug);
    if (!Number.isFinite(Date.parse(p.publishedAt))) fail('invalid article date');
    if (!p.coverImage?.asset?._ref || !p.coverImage.alt?.trim()) fail('cover image and alt text are required');
    if (!Array.isArray(p.body) || !p.body.some((b) => b._type === 'block' && blockText(b).trim())) fail('article text is required');
    for (const block of p.body) {
      if (block._type === 'image' && (!block.asset?._ref || !block.alt?.trim())) fail('inline images need an asset and alt text');
    }
    // Validate the asset reference now, before any output directory is replaced.
    imageURL(p.coverImage, 740, 480);
    return {...p, minutes: readingMinutes(p.body)};
  });
}

export function renderBody(body) {
  const toc = [];
  const blocks = body.map((block, index) => {
    if (block._type !== 'block' || !['h2', 'h3'].includes(block.style)) return block;
    const id = `section-${index}`;
    toc.push({id, title: blockText(block)});
    return {...block, headingId: id};
  });
  let firstParagraph = true;
  const html = toHTML(blocks, {
    components: {
      block: {
        normal: ({children}) => {
          const cls = firstParagraph ? ' class="article-lead"' : '';
          firstParagraph = false;
          return `<p${cls}>${children}</p>`;
        },
        h2: ({children, value}) => `<h2 id="${value.headingId}" data-toc-heading>${children}</h2>`,
        h3: ({children, value}) => `<h3 id="${value.headingId}" data-toc-heading>${children}</h3>`,
        blockquote: ({children}) => `<blockquote>${children}</blockquote>`,
      },
      marks: {
        link: ({children, value}) => {
          const href = safeLink(value?.href);
          return href ? `<a href="${esc(href)}"${/^https?:/i.test(href) ? ' rel="noopener noreferrer"' : ''}>${children}</a>` : children;
        },
      },
      types: {
        image: ({value}) => `<figure class="body-image">${imageHTML(value)}${value.caption ? `<figcaption>${esc(value.caption)}</figcaption>` : ''}</figure>`,
      },
    },
    // A new schema block must have a renderer; never silently omit published copy.
    onMissingComponent: (message) => { throw new Error(message); },
  });
  return {html, toc};
}

const dateFormat = (date, long = false) => new Intl.DateTimeFormat('en-GB', {day: 'numeric', month: long ? 'long' : 'short', year: 'numeric', timeZone: 'Africa/Lagos'}).format(new Date(date));
export function renderCard(post) {
  const href = articleURL(post);
  return `<article class="blog-card" data-category="${esc(post.category)}" data-search="${esc(`${post.title} ${post.excerpt} ${post.category}`.toLowerCase())}"><a class="cover-link" href="${href}">${imageHTML(post.coverImage, {card: true})}</a><div class="card-meta"><span class="category-pill">${esc(post.category)}</span><span data-reading-time>${post.minutes} min read</span></div><h3><a href="${href}">${esc(post.title)}</a></h3><p>${esc(post.excerpt)}</p><div class="card-bottom"><span><span class="blog-author">PurveyHq</span> · <time datetime="${esc(post.publishedAt)}">${dateFormat(post.publishedAt)}</time></span><a class="read-article" href="${href}" aria-label="Read article: ${esc(post.title)}">Read article</a></div></article>`;
}

function jsonLD(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, '\\u003c')}</script>`;
}
export function pageHead({title, description, path, image, post, preview = false}) {
  const canonical = `${siteURL}${path}`;
  const imageSrc = image || `${siteURL}/assets/purvey-social-icon.png`;
  const data = post ? {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
    description, image: imageSrc, datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    author: {'@type': 'Organization', name: 'PurveyHq', url: siteURL},
    publisher: {'@type': 'Organization', name: 'Purvey', url: siteURL},
    mainEntityOfPage: canonical, wordCount: words(post.body.filter((b) => b._type === 'block').map(blockText).join(' ')).length,
    timeRequired: `PT${post.minutes}M`,
  } : {'@context': 'https://schema.org', '@type': 'Blog', name: 'The Purvey Blog', description, url: canonical};
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${preview ? 'noindex,nofollow' : 'index,follow'}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${post ? 'article' : 'website'}"><meta property="og:site_name" content="Purvey"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(imageSrc)}"><meta property="og:image:alt" content="${esc(post?.coverImage.alt || 'Purvey — Your business, organised.')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageSrc)}">${post ? `<meta property="article:published_time" content="${esc(post.publishedAt)}">` : ''}<link rel="icon" href="/favicon.svg"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/blog.css"><link rel="stylesheet" href="/navigation.css"><link rel="stylesheet" href="/cookie-consent.css">${jsonLD(data)}`;
}

// Replace only original template tokens, never tokens inside merchant content.
export function fill(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template value ${key}`);
    return values[key];
  });
}

export function renderListing(template, posts, preview = false) {
  let page = fill(template, {
    HEAD: pageHead({title: 'The Purvey Blog | Guides for your business', description: 'Practical guides, ideas and product updates to help you sell online and manage your business with Purvey.', path: '/blog/', preview}),
    PREVIEW_NOTE: preview ? '<div class="preview-note">Design preview · Local layout fixtures only</div>' : '',
    CARDS: posts.map(renderCard).join(''),
    EMPTY_HEADING: posts.length ? 'No articles found.' : 'Your next read is on its way.',
    EMPTY_DESCRIPTION: posts.length ? 'Try another search or browse all articles.' : 'Merchant guides and product updates will appear here when published.',
    RESET_HIDDEN: posts.length ? '' : 'hidden',
  });
  if (!posts.length) page = page.replace('<div class="blog-empty" hidden>', '<div class="blog-empty" data-no-posts>');
  // Render current and future categories from the CMS while retaining their styling.
  const categories = [...new Set(posts.map((p) => p.category))];
  const buttons = ['All articles', ...categories].map((category, i) => `<button type="button" data-filter="${esc(category)}" aria-pressed="${i === 0}">${esc(category)}</button>`).join('');
  return page.replace(/(<div class="blog-filters"[^>]*>).*?(<\/div>)/s, (_, open, close) => open + buttons + close);
}

export function renderArticle(template, post, allPosts, preview = false) {
  const {html, toc} = renderBody(post.body);
  const related = allPosts.filter((p) => p.slug !== post.slug).sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category)).slice(0, 3);
  return fill(template, {
    HEAD: pageHead({title: `${post.title} | Purvey Blog`, description: post.seoDescription || post.excerpt, path: articleURL(post), image: imageURL(post.coverImage, 1200, 630), post, preview}),
    PREVIEW_NOTE: preview ? '<div class="preview-note">Design preview · Local layout fixtures only</div>' : '',
    CATEGORY_QUERY: encodeURIComponent(post.category), CATEGORY: esc(post.category), TITLE: esc(post.title), EXCERPT: esc(post.excerpt),
    DATE_ISO: esc(post.publishedAt), DATE_LONG: dateFormat(post.publishedAt, true), MINUTES: post.minutes,
    COVER: imageHTML(post.coverImage, {cover: true}), CAPTION: post.coverImage.caption ? `<figcaption>${esc(post.coverImage.caption)}</figcaption>` : '',
    TOC_HIDDEN: toc.length ? '' : 'hidden', TOC: toc.map((item) => `<a href="#${item.id}">${esc(item.title)}</a>`).join(''), BODY: html,
    RELATED: related.length ? `<section class="related"><h2>A little more for your next step.</h2><div class="blog-grid">${related.map(renderCard).join('')}</div></section>` : '',
  });
}
