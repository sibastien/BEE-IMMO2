const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const fs = require('fs/promises');
const path = require('path');
const connectDB = require('./config/db');
const Property = require('./models/Property');
const {
  getCloudinaryConfigSource,
  getMissingCloudinaryConfig,
  hasCloudinaryConfig
} = require('./config/cloudinary');
const { getWatermarkedImageUrl } = require('./utils/cloudinaryWatermark');
const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const blogRoutes = require('./routes/blogRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const metaCatalogRoutes = require('./routes/metaCatalogRoutes');
const getSitemap = require('./controllers/sitemapController');
const errorHandler = require('./middleware/errorHandler');
const { isPublicProperty } = require('./utils/propertyPublication');
const { buildPropertySlug, findPropertyByIdentifier } = require('./utils/propertySlug');

const frontendPath = path.join(__dirname, '..', 'frontend');

connectDB();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getAbsoluteUrl = (req, value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  return `${req.protocol}://${req.get('host')}${value.startsWith('/') ? value : `/${value}`}`;
};

const getSiteUrl = (req) =>
  (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

const buildPropertyMeta = (req, property) => {
  const title = property
    ? `${property.title} | Bee Immobilier`
    : 'Bee Immobilier - Immobilier';
  const description = property
    ? `${property.city || ''}${property.district ? `, ${property.district}` : ''} - ${property.description || ''}`.trim()
    : 'Acheter, vendre ou louer un bien immobilier avec Bee Immobilier.';
  const image = property
    ? `${req.protocol}://${req.get('host')}/property/${property._id}/og-image`
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80';
  const slug = property ? buildPropertySlug(property) : '';
  const url = property
    ? `${getSiteUrl(req)}/property/${encodeURIComponent(slug)}`
    : `${getSiteUrl(req)}${req.originalUrl}`;

  return `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Bee Immobilier" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description).slice(0, 280)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description).slice(0, 280)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  `;
};

// Middlewares globaux
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origine non autorisee par CORS'));
    },
  })
);
app.use(express.json({ limit: '40mb' }));

// SEO routes must stay before static files and any future catch-all route.
app.get('/sitemap.xml', getSitemap);

app.use(express.static(frontendPath));

// Routes
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: frontendPath });
});

app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: frontendPath });
});

app.get('/admin/requests', (req, res) => {
  res.sendFile('requests.html', { root: frontendPath });
});

app.get('/admin/blog', (req, res) => {
  res.sendFile('admin-blog.html', { root: frontendPath });
});

app.get('/admin/testimonials', (req, res) => {
  res.sendFile('admin-testimonials.html', { root: frontendPath });
});

app.get('/acheter', (req, res) => {
  res.sendFile('acheter.html', { root: frontendPath });
});

app.get('/louer', (req, res) => {
  res.sendFile('louer.html', { root: frontendPath });
});

app.get('/blog', (req, res) => {
  res.sendFile('blog.html', { root: frontendPath });
});

app.get('/blog/:slug', (req, res) => {
  res.sendFile('blog-detail.html', { root: frontendPath });
});

app.get('/property/:identifier', async (req, res, next) => {
  try {
    const property = await findPropertyByIdentifier(Property, req.params.identifier);

    if (!isPublicProperty(property)) {
      return res.status(404).sendFile('property.html', { root: frontendPath });
    }

    const canonicalSlug = buildPropertySlug(property);
    if (req.params.identifier !== canonicalSlug) {
      return res.redirect(301, `/property/${encodeURIComponent(canonicalSlug)}`);
    }

    const html = await fs.readFile(path.join(frontendPath, 'property.html'), 'utf8');
    const htmlWithMeta = html.replace(/<\/head>/i, `<!-- Bee Immobilier Open Graph -->${buildPropertyMeta(req, property)}</head>`);

    res.set('X-Bee-Open-Graph', 'property');
    res.type('html').send(htmlWithMeta);
  } catch (error) {
    next(error);
  }
});

app.get('/property/:id/og-image', async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    const image = property?.images?.[0];

    if (!image) {
      return res.redirect('https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80');
    }

    if (/^https?:\/\//i.test(image)) {
      return res.redirect(getWatermarkedImageUrl(image));
    }

    const match = image.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);

    if (!match) {
      return res.redirect(getAbsoluteUrl(req, image));
    }

    const [, contentType, base64Data] = match;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400'
    });
    return res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Bee Immobilier en ligne',
    cloudinaryConfigured: hasCloudinaryConfig(),
    cloudinaryConfigSource: getCloudinaryConfigSource(),
    missingCloudinaryConfig: getMissingCloudinaryConfig()
  });
});

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/meta', metaCatalogRoutes);

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
