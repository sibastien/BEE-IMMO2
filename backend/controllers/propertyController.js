const Property = require('../models/Property');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

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

      if (!configureCloudinary()) {
        throw new Error('Configuration Cloudinary manquante');
      }

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
    const properties = await Property.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties
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

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

// Modifier une annonce
const updateProperty = async (req, res, next) => {
  try {
    const payload = await normalizePropertyPayload(req.body);
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
