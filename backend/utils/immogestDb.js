// Save as: backend/utils/immogestDb.js in the OTHER site's repo.
//
// Read-only bridge to ImmoGest Pro's SQLite database. ImmoGest owns all
// writes to `properties`; this site only ever reads published rows and
// reshapes them to look like the Mongoose Property documents the rest of
// this codebase (controllers, frontend) already expects.
//
// Requires: npm install better-sqlite3   (in the OTHER site's backend/)

const Database = require('better-sqlite3');
const { buildPropertySlug } = require('./propertySlug');

const IMMOGEST_DB_PATH =
  process.env.IMMOGEST_DB_PATH || '/home/ubuntu/crm/immogest-pro/server/data/immogest.db';

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

function parseImages(photosJson) {
  let photos;
  try {
    photos = JSON.parse(photosJson || '[]');
  } catch {
    photos = [];
  }
  if (!Array.isArray(photos)) return [];
  return photos.filter(
    (url) =>
      url &&
      typeof url === 'string' &&
      (/^https?:\/\/.+/i.test(url) || /^data:image\/(png|jpe?g|webp);base64,/i.test(url))
  );
}

// Row (snake_case, as stored in ImmoGest) -> doc shaped like a Mongoose
// Property.toObject(), so the existing controller normalization/response
// code doesn't need to know the data came from a different database.
function rowToDoc(row) {
  const propertyType = PROPERTY_TYPE[row.type] || 'apartment';

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
    images: parseImages(row.photos),
    status: mapStatus(row.status),
    isPublished: !!row.published,
    deletedAt: null,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };

  doc.slug = buildPropertySlug(doc);
  return doc;
}

function getPublishedProperties() {
  const rows = db
    .prepare('SELECT * FROM properties WHERE published = 1 ORDER BY created_at DESC')
    .all();
  return rows.map(rowToDoc);
}

// Mirrors findPropertyByIdentifier: accepts an ImmoGest id (e.g. "prop-172...")
// or a slug ("villa-vue-mer-v-abc-123"), only among published properties.
function getPublishedPropertyByIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const byId = db.prepare('SELECT * FROM properties WHERE published = 1 AND id = ?').get(value);
  if (byId) return rowToDoc(byId);

  const rows = db.prepare('SELECT * FROM properties WHERE published = 1').all();
  const bySlug = rows.find((row) => buildPropertySlug(rowToDoc(row)) === value);
  return bySlug ? rowToDoc(bySlug) : null;
}

module.exports = { getPublishedProperties, getPublishedPropertyByIdentifier };
