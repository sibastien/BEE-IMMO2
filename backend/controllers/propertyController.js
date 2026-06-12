const Property = require('../models/Property');
const {
  assertCloudinaryConfigured,
  cloudinary
} = require('../config/cloudinary');
const { getNextReference } = require('../utils/propertyReference');

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

// Afficher toutes les annonces
const getProperties = async (req, res, next) => {
  try {
    // Include available properties and old data with missing or legacy status values.
    const properties = await Property.find({
      $or: [
        { status: 'available' },
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { status: { $nin: ['available', 'sold', 'rented'] } }
      ]
    }).sort({ createdAt: -1 });

    // Normalize properties to ensure they have required fields
    const normalizedProperties = properties.map((property) => {
      const doc = property.toObject();

      // Ensure status exists and is valid
      if (!doc.status || !['available', 'sold', 'rented'].includes(doc.status)) {
        doc.status = 'available';
      }

      // Ensure images is an array
      if (!Array.isArray(doc.images)) {
        if (typeof doc.image === 'string' && doc.image) {
          // Migrate old 'image' field to 'images' array
          doc.images = [doc.image];
        } else {
          doc.images = [];
        }
      }

      // Filter invalid image URLs
      doc.images = doc.images.filter(
        (url) =>
          url &&
          typeof url === 'string' &&
          (/^https?:\/\/.+/i.test(url) || /^data:image\/(png|jpe?g|webp);base64,/i.test(url))
      );

      // Ensure numeric fields have proper defaults for non-land properties
      if (doc.propertyType !== 'land') {
        if (typeof doc.bedrooms !== 'number' || doc.bedrooms < 0) {
          doc.bedrooms = 0;
        }
        if (typeof doc.bathrooms !== 'number' || doc.bathrooms < 0) {
          doc.bathrooms = 0;
        }
      }

      // Ensure other numeric fields
      if (typeof doc.garages !== 'number' || doc.garages < 0) {
        doc.garages = 0;
      }
      if (typeof doc.abris !== 'number' || doc.abris < 0) {
        doc.abris = 0;
      }

      return doc;
    });

    res.status(200).json({
      success: true,
      count: normalizedProperties.length,
      data: normalizedProperties
    });
  } catch (error) {
    next(error);
  }
};

// Afficher une annonce par ID
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404);
      throw new Error('Annonce introuvable');
    }

    // Normalize the property document
    const doc = property.toObject();

    // Ensure status exists and is valid
    if (!doc.status || !['available', 'sold', 'rented'].includes(doc.status)) {
      doc.status = 'available';
    }

    // Ensure images is an array
    if (!Array.isArray(doc.images)) {
      if (typeof doc.image === 'string' && doc.image) {
        // Migrate old 'image' field to 'images' array
        doc.images = [doc.image];
      } else {
        doc.images = [];
      }
    }

    // Filter invalid image URLs
    doc.images = doc.images.filter(
      (url) =>
        url &&
        typeof url === 'string' &&
        (/^https?:\/\/.+/i.test(url) || /^data:image\/(png|jpe?g|webp);base64,/i.test(url))
    );

    // Ensure numeric fields have proper defaults
    if (doc.propertyType !== 'land') {
      if (typeof doc.bedrooms !== 'number' || doc.bedrooms < 0) {
        doc.bedrooms = 0;
      }
      if (typeof doc.bathrooms !== 'number' || doc.bathrooms < 0) {
        doc.bathrooms = 0;
      }
    }

    if (typeof doc.garages !== 'number' || doc.garages < 0) {
      doc.garages = 0;
    }
    if (typeof doc.abris !== 'number' || doc.abris < 0) {
      doc.abris = 0;
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
