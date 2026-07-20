const Property = require('../models/Property');
const {
  assertCloudinaryConfigured,
  cloudinary
} = require('../config/cloudinary');
const { getNextReference } = require('../utils/propertyReference');
const { buildPropertySlug, findPropertyByIdentifier } = require('../utils/propertySlug');
const { getPublicPropertyFilter } = require('../utils/propertyPublication');
const { getPublishedProperties, getPublishedPropertyByIdentifier } = require('../utils/immogestDb');

const isBase64Image = (image) => /^data:image\/(png|jpe?g|webp);base64,/i.test(image || '');

const uploadPropertyImages = async (images = []) => {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const uploadedImages = await Promise.all(
    images.map(async (image) => {
      if (!isBase64Image(image)) {
        return image;
      }

      assertCloudinaryConfigured();

      const upload = await cloudinary.uploader.upload(image, {
        folder: 'bee-consulting/properties',
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1100, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return upload.secure_url;
    })
  );

  return uploadedImages.filter(Boolean);
};

const normalizePropertyPayload = async (body) => {
  const payload = { ...body };

  if (payload.images) {
    payload.images = await uploadPropertyImages(payload.images);
  }

  return payload;
};

// Creer une annonce
const createProperty = async (req, res, next) => {
  try {
    const payload = await normalizePropertyPayload(req.body);

    if (!payload.reference) {
      payload.reference = await getNextReference(Property, payload.transactionType, payload.propertyType);
    }

    const property = await Property.create(payload);

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// Afficher toutes les annonces (source: ImmoGest, read-only)
const getProperties = async (req, res, next) => {
  try {
    const normalizedProperties = await getPublishedProperties();

    res.status(200).json({
      success: true,
      count: normalizedProperties.length,
      data: normalizedProperties
    });
  } catch (error) {
    next(error);
  }
};

// Afficher une annonce par ID ou slug (source: ImmoGest, read-only)
const getPropertyById = async (req, res, next) => {
  try {
    const doc = await getPublishedPropertyByIdentifier(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Annonce introuvable');
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une annonce
const updateProperty = async (req, res, next) => {
  try {
    const payload = await normalizePropertyPayload(req.body);
    delete payload.reference;

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true
      }
    );

    if (!property) {
      res.status(404);
      throw new Error('Annonce introuvable');
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// Supprimer une annonce
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Annonce introuvable');
    }

    res.status(200).json({
      success: true,
      message: 'Annonce supprimee'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};
