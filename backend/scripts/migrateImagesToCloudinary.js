require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/Property');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

const isBase64Image = (image) => /^data:image\/(png|jpe?g|webp);base64,/i.test(image || '');

const uploadImage = async (image, propertyId, imageIndex) => {
  const upload = await cloudinary.uploader.upload(image, {
    folder: 'bee-consulting/properties',
    resource_type: 'image',
    public_id: `${propertyId}-${imageIndex}-${Date.now()}`,
    transformation: [
      { width: 1600, height: 1100, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  return upload.secure_url;
};

const migrateImages = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI manquant');
  }

  if (!configureCloudinary()) {
    throw new Error('Configuration Cloudinary manquante');
  }

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000
  });

  const properties = await Property.find({
    images: { $elemMatch: { $regex: '^data:image/', $options: 'i' } }
  });

  let uploadedImages = 0;
  let updatedProperties = 0;

  for (const property of properties) {
    const migratedImages = [];
    let hasChanges = false;

    for (let index = 0; index < property.images.length; index += 1) {
      const image = property.images[index];

      if (!isBase64Image(image)) {
        migratedImages.push(image);
        continue;
      }

      const imageUrl = await uploadImage(image, property._id.toString(), index);
      migratedImages.push(imageUrl);
      uploadedImages += 1;
      hasChanges = true;
    }

    if (hasChanges) {
      property.images = migratedImages;
      await property.save();
      updatedProperties += 1;
      console.log(`OK ${property.title} (${property._id})`);
    }
  }

  await mongoose.disconnect();

  console.log(
    JSON.stringify(
      {
        connectedDatabase: conn.connection.name,
        updatedProperties,
        uploadedImages
      },
      null,
      2
    )
  );
};

migrateImages().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
