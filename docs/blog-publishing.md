# Purvey blog publishing

## Status

The website build can read published content from project `9o3cppt2`, dataset `production`. The integration has not been pushed or deployed. No content has been created or published by this setup. The first live read returned zero published posts.

The standalone Studio and marketing website remain separate sibling folders and separate Git repositories. Nothing in the Laravel application is involved.

## 1. Review and deploy the code

Review the integration in a preview branch first. Importing the Studio repository into the marketing website's Vercel project is unnecessary.

The existing **marketing website** Vercel project must use:

| Setting | Value |
| --- | --- |
| Repository | `purveyhq/purvey-website` |
| Framework preset | Other |
| Root directory | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `build` |
| Node.js | 22.x or newer |

`vercel.json` declares the build settings. Clear stale dashboard overrides, or match the table. Do not change domains or DNS. Deploy to production only after review.

The Studio schema change sets the default author to PurveyHq and validates URL slugs. Pull that change into the sibling Studio repository separately. Restart `npm run dev` if needed. Existing article content is not rewritten.

Optional later: deploy the standalone Studio with `npm run deploy` from its own folder for editing without a local development server. This does not deploy the marketing website. Choose the Studio hostname in your own Sanity account.

## 2. Create the Vercel Deploy Hook

In the **marketing website** project, open **Settings → Git → Deploy Hooks**:

- Name: `Sanity blog publish`
- Branch: the reviewed production branch, normally `main`
- Create the hook and copy its URL.

Keep the URL private: anyone with it can trigger a rebuild. Paste it directly into Sanity, not into Git or chat. Creating a hook does not itself finish the publishing connection.

## 3. Connect Sanity

In https://www.sanity.io/manage/project/9o3cppt2, open **API → Webhooks → Create webhook**:

| Field | Value |
| --- | --- |
| Name | Purvey website rebuild |
| URL | The private Vercel Deploy Hook URL |
| Dataset | production |
| Trigger on | Create, Update **and Delete** |
| HTTP method | POST |
| Draft events | Disabled |
| Version events | Disabled |
| Enabled | Yes |

Filter:

```groq
coalesce(after()._type, before()._type) == "post"
```

Projection:

```groq
{"_id": coalesce(after()._id, before()._id)}
```

Using both snapshots handles unpublishing/deletion. Delete events are required so withdrawn articles disappear from the next website build. Draft edits should not rebuild the site.

The Deploy Hook accepts the request directly; no custom webhook API, write token or new backend service is needed. Keep draft/version events off to avoid rebuilds on every keystroke.

## 4. Test the complete publishing flow

Only after the code and hook are approved and configured:

1. Create an article in Studio with a real cover image, alt text, title, generated slug, summary, category, date and body. Include an H2, a list and a link.
2. Save it as a draft. Confirm it does **not** appear on the public listing.
3. Publish it. Confirm a Sanity webhook delivery and a new Vercel deployment.
4. Wait for deployment to become Ready. Open `/blog/`, click the article, and reload the detail URL directly.
5. Check phone and desktop layouts, cover crop, the published author name, calculated reading time, share icons, copy link, reading progress and table-of-contents links.
6. Check the article HTML contains its content, canonical URL, description, sharing metadata and BlogPosting JSON-LD; confirm its URL is in `/sitemap.xml`.
7. Publish a small edit. Confirm the rebuild shows it.
8. Unpublish a disposable test article. Confirm a rebuild removes its card, article file and sitemap entry. Do not unpublish a real article just for this test.

Publishing is followed by a build delay. If a build fails, Vercel continues serving the previous successful deployment; fix the content or connection and rebuild. Unpublished articles therefore remain live until a successful rebuild completes.

## Sources

- Sanity published perspective: https://reference.sanity.io/_sanity/client/
- Sanity webhook triggers and draft settings: https://www.sanity.io/docs/content-lake/webhooks
- Vercel Deploy Hooks: https://vercel.com/docs/deploy-hooks
