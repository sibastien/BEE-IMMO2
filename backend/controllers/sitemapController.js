const BlogPost = require('../models/BlogPost');
const Property = require('../models/Property');
const { getPublicPropertyFilter } = require('../utils/propertyPublication');
const { buildPropertySlug } = require('../utils/propertySlug');

const DEFAULT_SITE_URL = 'https://beeimmobilier.com';

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getSiteUrl = () => (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

const formatLastmod = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : '';
};

const getSitemap = async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl();
    const [properties, posts] = await Promise.all([
      Property.find(getPublicPropertyFilter())
        .select('_id title slug reference updatedAt')
        .lean(),
      BlogPost.find({ status: 'published' })
        .select('slug updatedAt publishedAt')
        .lean()
    ]);

    const entries = new Map();
    const addEntry = (path, options = {}) => {
      const normalizedPath = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`;
      const location = `${siteUrl}${normalizedPath}`;

      if (!entries.has(location)) {
        entries.set(location, {
          location,
          lastmod: formatLastmod(options.lastmod),
          changefreq: options.changefreq,
          priority: options.priority
        });
      }
    };

    addEntry('/', { changefreq: 'daily', priority: '1.0' });
    addEntry('/acheter', { changefreq: 'daily', priority: '0.9' });
    addEntry('/louer', { changefreq: 'daily', priority: '0.9' });
    addEntry('/blog', { changefreq: 'weekly', priority: '0.7' });

    properties.forEach((property) => {
      const slug = buildPropertySlug(property);
      if (!slug) return;

      addEntry(`/property/${encodeURIComponent(slug)}`, {
        lastmod: property.updatedAt,
        changefreq: 'weekly',
        priority: '0.8'
      });
    });

    posts.forEach((post) => {
      if (!post.slug) return;

      addEntry(`/blog/${encodeURIComponent(post.slug)}`, {
        lastmod: post.updatedAt || post.publishedAt,
        changefreq: 'monthly',
        priority: '0.6'
      });
    });

    const urls = [...entries.values()]
      .map((entry) => `  <url>
    <loc>${escapeXml(entry.location)}</loc>${entry.lastmod ? `
    <lastmod>${entry.lastmod}</lastmod>` : ''}${entry.changefreq ? `
    <changefreq>${entry.changefreq}</changefreq>` : ''}${entry.priority ? `
    <priority>${entry.priority}</priority>` : ''}
  </url>`)
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.status(200).set({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600'
    }).send(xml);
  } catch (error) {
    next(error);
  }
};

module.exports = getSitemap;
