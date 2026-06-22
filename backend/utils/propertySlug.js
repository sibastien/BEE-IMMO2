const mongoose = require('mongoose');

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildPropertySlug = (property) => {
  if (property?.slug) return property.slug;

  const title = slugify(property?.title) || 'bien-immobilier';
  const suffix = property?.reference
    ? String(property.reference).toLowerCase()
    : String(property?._id || property?.id || '').toLowerCase();

  return suffix ? `${title}-${suffix}` : title;
};

const findPropertyByIdentifier = async (Property, identifier) => {
  const value = String(identifier || '').trim();
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    const propertyById = await Property.findById(value);
    if (propertyById) return propertyById;
  }

  const propertyBySlug = await Property.findOne({ slug: value });
  if (propertyBySlug) return propertyBySlug;

  const idMatch = value.match(/-([a-f0-9]{24})$/i);
  if (idMatch) {
    const propertyBySlugId = await Property.findById(idMatch[1]);
    if (propertyBySlugId) return propertyBySlugId;
  }

  const referenceMatch = value.match(/-([a-z]{2}\d{3})$/i);
  if (referenceMatch) {
    return Property.findOne({ reference: referenceMatch[1].toUpperCase() });
  }

  return null;
};

module.exports = {
  buildPropertySlug,
  findPropertyByIdentifier,
  slugify
};
