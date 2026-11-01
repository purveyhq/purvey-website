// Public identifiers only. No credentials belong in browser scripts or templates.
export const siteURL = 'https://www.purveyhq.com';
export const sanityConfig = {
  projectId: process.env.SANITY_PROJECT_ID || '9o3cppt2',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2026-10-31',
  perspective: 'published',
  // One read per build; bypass the CDN so a publish-triggered build is current.
  useCdn: false,
};
export const postsQuery = `*[_type == "post" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))] | order(publishedAt desc, _id asc) {
  _id, _updatedAt, title, "slug": slug.current, excerpt, category,
  publishedAt, author, authorImage, seoDescription, coverImage, body
}`;
