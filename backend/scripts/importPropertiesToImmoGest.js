require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');

/**
 * One-time import: reads all non-deleted properties from this site's Mongo
 * Atlas database and creates them in ImmoGest Pro via its REST API, so
 * existing listings don't have to be re-entered by hand.
 *
 * Imported properties are created as unpublished (published: false) so they
 * can be reviewed in ImmoGest before going live anywhere.
 *
 * Required env vars:
 *   MONGO_URI               - existing Mongo Atlas connection string
 *   IMMOGEST_API_URL         - e.g. https://crm.beeimmobilier.com/api
 *   IMMOGEST_ADMIN_EMAIL     - ImmoGest admin login email
 *   IMMOGEST_ADMIN_PASSWORD  - ImmoGest admin login password
 */

const TRANSACTION_TYPE = { sale: 'vente', rent: 'location' };
const PROPERTY_TYPE = {
  apartment: 'appartement',
  house: 'maison',
  villa: 'villa',
  land: 'terrain',
  commercial: 'commercial',
};
const STATUS = { available: 'disponible', sold: 'vendu', rented: 'loue' };

function mapPropertyToImmoGest(property, agentId) {
  const city = property.city || '';
  const district = property.district || '';
  const location = [city, district].filter(Boolean).join(', ') || city || district || '';

  return {
    ref: property.reference || undefined,
    title: property.title,
    transaction: TRANSACTION_TYPE[property.transactionType] || 'vente',
    type: PROPERTY_TYPE[property.propertyType] || 'appartement',
    status: STATUS[property.status] || 'disponible',
    price: property.price || 0,
    priceType: property.transactionType === 'rent' ? 'mois' : 'vente',
    surface: property.surface || 0,
    rooms: property.propertyType === 'land' ? undefined : property.bedrooms || 0,
    bathrooms: property.propertyType === 'land' ? undefined : property.bathrooms || 0,
    location,
    address: property.address || '',
    agentId,
    photos: Array.isArray(property.images) ? property.images.filter(Boolean) : [],
    description: property.description || '',
    features: [],
    parking: (property.garages || 0) > 0,
    published: false,
    createdAt: property.createdAt
      ? new Date(property.createdAt).toISOString().split('T')[0]
      : undefined,
  };
}

async function loginToImmoGest(apiUrl, email, password) {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Echec de connexion a ImmoGest');
  }

  return result;
}

async function createImmoGestProperty(apiUrl, token, payload) {
  const response = await fetch(`${apiUrl}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || `HTTP ${response.status}`);
  }

  return result;
}

const importPropertiesToImmoGest = async () => {
  const {
    MONGO_URI,
    IMMOGEST_API_URL,
    IMMOGEST_ADMIN_EMAIL,
    IMMOGEST_ADMIN_PASSWORD,
  } = process.env;

  if (!MONGO_URI) throw new Error('MONGO_URI manquant');
  if (!IMMOGEST_API_URL) throw new Error('IMMOGEST_API_URL manquant');
  if (!IMMOGEST_ADMIN_EMAIL || !IMMOGEST_ADMIN_PASSWORD) {
    throw new Error('IMMOGEST_ADMIN_EMAIL / IMMOGEST_ADMIN_PASSWORD manquant');
  }

  console.log('Connexion a ImmoGest...');
  const { token, user } = await loginToImmoGest(
    IMMOGEST_API_URL,
    IMMOGEST_ADMIN_EMAIL,
    IMMOGEST_ADMIN_PASSWORD
  );
  const agentId = user.agentId || user.id;
  console.log(`✓ Connecte a ImmoGest en tant que ${user.name || IMMOGEST_ADMIN_EMAIL}\n`);

  console.log('Connexion a MongoDB...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✓ Connecte a MongoDB\n');

  const properties = await Property.find({ deletedAt: null });
  console.log(`${properties.length} bien(s) trouve(s) dans Mongo\n`);

  const results = { successful: [], errors: [] };

  for (const property of properties) {
    try {
      const payload = mapPropertyToImmoGest(property, agentId);
      const created = await createImmoGestProperty(IMMOGEST_API_URL, token, payload);
      results.successful.push({
        mongoId: property._id.toString(),
        immogestId: created.id,
        title: property.title,
      });
      console.log(`✓ ${property.title}`);
    } catch (error) {
      results.errors.push({
        mongoId: property._id.toString(),
        title: property.title,
        error: error.message,
      });
      console.log(`✗ ${property.title} — ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('RAPPORT D\'IMPORT');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Importes: ${results.successful.length}`);
  console.log(`❌ Erreurs: ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log('\nDetail des erreurs:');
    results.errors.forEach((e) => console.log(`   - ${e.title}: ${e.error}`));
  }
  console.log('\nTous les biens importes sont NON PUBLIES (published: false).');
  console.log('Verifiez-les dans ImmoGest puis publiez-les manuellement.\n');

  await mongoose.disconnect();
  return results;
};

importPropertiesToImmoGest().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
