// Save as: backend/utils/immogestDb.js in the OTHER site's repo.
//
// Read-only bridge to ImmoGest Pro's SQLite database. ImmoGest owns all
// writes to `properties`; this site only ever reads published rows and
// reshapes them to look like the Mongoose Property documents the rest of
// this codebase (controllers, frontend) already expects.
//
// Photos: ImmoGest serves photos from its own server (crm.beeimmobilier.com),
// not Cloudinary, so the existing Cloudinary-URL watermark (getWatermarkedImageUrl /
// BeeImages.withWatermark) can't touch them as-is. To keep that watermark code
// unchanged, each ImmoGest photo is uploaded to Cloudinary the first time it's
// seen, and the resulting res.cloudinary.com URL is cached on disk so we don't
// re-upload on every request.
//
// Requires: npm install better-sqlite3   (in the OTHER site's backend/)

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { cloudinary } = require('../config/cloudinary');
const { buildPropertySlug } = require('./propertySlug');

const IMMOGEST_DB_PATH =
  process.env.IMMOGEST_DB_PATH || '/home/ubuntu/crm/immogest-pro/server/data/immogest.db';

const IMMOGEST_PUBLIC_URL = process.env.IMMOGEST_PUBLIC_URL || 'https://crm.beeimmobilier.com';

const CACHE_PATH = path.join(__dirname, '..', 'data', 'immogest-image-cache.json');

const db = new Database(IMMOGEST_DB_PATH, { readonly: true, fileMustExist: true });

const TRANSACTION_TYPE = { vente: 'sale', location: 'rent' };
const PROPERTY_TYPE = {
  villa: 'villa',
  appartement: 'apartment',
  maison: 'house',
  commercial: 'commercial',
  terrain: 'land',
};

function mapStatus(status) {
  if (status === 'vendu') return 'sold';
  if (status === 'loue') return 'rented';
  // 'disponible' and 'sous_compromis' both read as available on the public site.
  return 'available';
}

// --- Cloudinary URL cache (ImmoGest photo URL -> Cloudinary secure_url) ---

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf8');
}

let imageCache = loadCache();

async function toCloudinaryUrl(immogestUrl) {
  if (imageCache[immogestUrl]) return imageCache[immogestUrl];

  const upload = await cloudinary.uploader.upload(immogestUrl, {
    folder: 'bee-consulting/properties',
    resource_type: 'image',
  });

  imageCache[immogestUrl] = upload.secure_url;
  saveCache(imageCache);
  return upload.secure_url;
}

function parseImageUrls(photosJson) {
  let photos;
  try {
    photos = JSON.parse(photosJson || '[]');
  } catch {
    photos = [];
  }
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((url) => url && typeof url === 'string')
    .map((url) => (url.startsWith('/') ? `${IMMOGEST_PUBLIC_URL}${url}` : url));
}

// --- Row -> doc mapping ---

// Row (snake_case, as stored in ImmoGest) -> doc shaped like a Mongoose
// Property.toObject(), so the existing controller normalization/response
// code doesn't need to know the data came from a different database.
async function rowToDoc(row) {
  const propertyType = PROPERTY_TYPE[row.type] || 'apartment';
  const immogestImageUrls = parseImageUrls(row.photos);
  const images = await Promise.all(immogestImageUrls.map(toCloudinaryUrl));

  const doc = {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description || '',
    reference: row.ref || undefined,
    price: row.price,
    transactionType: TRANSACTION_TYPE[row.deal_type] || 'sale',
    rentalType: row.price_type === 'mois' ? 'standard' : undefined,
    propertyType,
    city: row.location || '',
    district: '',
    address: row.address || '',
    surface: row.surface,
    bedrooms: propertyType === 'land' ? 0 : row.rooms || 0,
    bathrooms: propertyType === 'land' ? 0 : row.bathrooms || 0,
    garages: row.parking ? 1 : 0,
    abris: 0,
    images,
    status: mapStatus(row.status),
    isPublished: !!row.published,
    deletedAt: null,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };

  doc.slug = buildPropertySlug(doc);
  return doc;
}

async function getPublishedProperties() {
  const rows = db
    .prepare('SELECT * FROM properties WHERE published = 1 ORDER BY created_at DESC')
    .all();
  return Promise.all(rows.map(rowToDoc));
}

// Mirrors findPropertyByIdentifier: accepts an ImmoGest id (e.g. "prop-172...")
// or a slug ("villa-vue-mer-v-abc-123"), only among published properties.
async function getPublishedPropertyByIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const byId = db.prepare('SELECT * FROM properties WHERE published = 1 AND id = ?').get(value);
  if (byId) return rowToDoc(byId);

  const rows = db.prepare('SELECT * FROM properties WHERE published = 1').all();
  for (const row of rows) {
    const doc = await rowToDoc(row);
    if (doc.slug === value) return doc;
  }
  return null;
}

module.exports = { getPublishedProperties, getPublishedPropertyByIdentifier };
