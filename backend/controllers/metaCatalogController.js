const Property = require('../models/Property');
const { getWatermarkedImageUrl } = require('../utils/cloudinaryWatermark');

const propertyTypeLabels = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  land: 'Terrain',
  commercial: 'Commercial'
};

const transactionLabels = {
  sale: 'Vente',
  rent: 'Location'
};

const getPublicSiteUrl = (req) => {
  const clientOrigin = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .find(Boolean);

  return (clientOrigin || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
};

const getApiUrl = (req) => `${req.protocol}://${req.get('host')}`;

const getCatalogItemId = (property) =>
  String(property.reference || property._id || property.id);

const csvValue = (value) => {
  const normalized = String(value ?? '')
    .replace(/\r?\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `"${normalized.replace(/"/g, '""')}"`;
};

const getImageUrl = (req, property, imageUrl) => {
  if (!imageUrl) {
    return `${getApiUrl(req)}/property/${property._id}/og-image`;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return getWatermarkedImageUrl(imageUrl);
  }

  return `${getApiUrl(req)}/property/${property._id}/og-image`;
};

const getCatalogFeed = async (req, res, next) => {
  try {
    const siteUrl = getPublicSiteUrl(req);
    const properties = await Property.find({
      $or: [
        { status: 'available' },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { status: { $nin: ['available', 'sold', 'rented'] } }
      ]
    }).sort({ updatedAt: -1, createdAt: -1 });

    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'brand',
      'product_type',
      'custom_label_0',
      'custom_label_1',
      'custom_label_2',
      'additional_image_link'
    ];

    const rows = properties.map((property) => {
      const images = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
      const propertyId = getCatalogItemId(property);
      const imageLink = getImageUrl(req, property, images[0]);
      const additionalImages = images
        .slice(1, 10)
        .map((imageUrl) => getImageUrl(req, property, imageUrl))
        .join(',');
      const title = property.reference
        ? `${property.title} - REF ${property.reference}`
        : property.title;
      const productType = [
        'Immobilier',
        transactionLabels[property.transactionType] || property.transactionType,
        propertyTypeLabels[property.propertyType] || property.propertyType
      ]
        .filter(Boolean)
        .join(' > ');

      return [
        propertyId,
        title,
        property.description,
        'in stock',
        'new',
        `${Number(property.price || 0).toFixed(2)} TND`,
        `${siteUrl}/property/${property._id}`,
        imageLink,
        'Bee Immobiliers',
        productType,
        transactionLabels[property.transactionType] || property.transactionType,
        propertyTypeLabels[property.propertyType] || property.propertyType,
        [property.city, property.district].filter(Boolean).join(', '),
        additionalImages
      ].map(csvValue).join(',');
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'inline; filename="bee-immobiliers-meta-catalog.csv"',
      'Cache-Control': 'public, max-age=900'
    });
    res.send([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCatalogFeed
};
