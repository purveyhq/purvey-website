# Purvey Website

Official marketing website for **Purvey by Secern Technologies**.

Purvey helps Nigerian businesses create an online storefront and manage products, inventory, orders, customers and payments.

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- SVG, PNG and WebP assets

The website remains static. A small Node.js build reads published articles from Sanity and generates the blog listing, article pages and sitemap. There is no website database or server to maintain.

## Project structure

`dist/` contains the existing marketing pages, styles, scripts and images. Blog HTML is generated from `templates/`. `build/` is the deployable output; do not edit generated files.

The standalone Sanity Studio is in the separate `purveyhq/purvey-blog-studio` repository, in a sibling folder on your computer. It is not embedded in this website.

## Local preview

Use Node.js 22.12 or newer. Run from the repository root:

```sh
npm ci
npm run build
python3 -m http.server 8000 --directory build
```

Open http://localhost:8000.

## Vercel deployment

Import this repository into Vercel using:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | Repository root |
| Build Command | `npm run build` |
| Output Directory | `build` |
| Install Command | `npm ci` |
| Node.js | 22.x or newer |

These values are also declared in `vercel.json`. Remove old dashboard overrides or set them to the values above when the integration is approved for deployment. Keep the existing website project and domain.

## Sanity content

- Project: Purvey Blog (`9o3cppt2`)
- Dataset: `production`
- Document type: `post`
- Author displayed on the website: **PurveyHq**
- Published posts only. Drafts and release versions are excluded.
- The article date is a display date, not a publishing scheduler.
- Reading time is calculated from article text at 200 words per minute.
- Slugs must use lowercase letters, numbers and hyphens, up to 96 characters.
- Each article needs a title, slug, summary, category, date, cover image with alt text, and body text.
- Images respect Sanity crop/hotspot choices and use responsive CDN sizes.
- Published posts with invalid required fields fail the build rather than silently disappear.
- No published articles produces an intentional empty listing, with no sample content.
- Unpublishing, deleting or changing a slug removes the old page on the next successful build. Old slugs do not automatically redirect; choose stable slugs before publishing.

The public dataset currently builds without a token. If you later make it private, set `SANITY_READ_TOKEN` to a **Viewer** token in Vercel's environment settings. For local use, put it in the ignored `.env.local`. Never put a token in HTML, browser JavaScript or Git.

## Publishing workflow

Write in Sanity Studio → Publish → Sanity webhook → Vercel rebuild → Updated blog.

Setup and smoke-test instructions are in [docs/blog-publishing.md](docs/blog-publishing.md). The webhook must be configured in your accounts; adding this code alone does not activate automatic deployment.

## Checks

```sh
npm test
npm run build
```

Tests cover rich text, escaping, links, metadata, reading time, published-only output, empty states, stale-page removal and failed builds. Test fixtures are local-only and are never uploaded to Sanity or used as production fallback content.

For a local layout check only:

```sh
node scripts/build-blog.mjs --fixture=tests/fixtures/posts.json
python3 -m http.server 8000 --directory .preview
```

This output is noindex and cannot be built in Vercel. Local fixtures use the existing editorial artwork. Production pages always use real images uploaded through Sanity.

## Website addresses

- Marketing website: https://purveyhq.com
- Merchant application: https://app.purveyhq.com
