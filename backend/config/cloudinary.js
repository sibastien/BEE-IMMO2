const cloudinary = require('cloudinary').v2;

const getMissingCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL) {
    return [];
  }

  return [
    ['CLOUDINARY_CLOUD_NAME', process.env.CLOUDINARY_CLOUD_NAME],
    ['CLOUDINARY_API_KEY', process.env.CLOUDINARY_API_KEY],
    ['CLOUDINARY_API_SECRET', process.env.CLOUDINARY_API_SECRET]
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);
};

const hasCloudinaryConfig = () =>
  getMissingCloudinaryConfig().length === 0;

const configureCloudinary = () => {
  if (!hasCloudinaryConfig()) {
    return false;
  }

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      secure: true
    });
    return true;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  return true;
};

module.exports = {
  cloudinary,
  configureCloudinary,
  getMissingCloudinaryConfig,
  hasCloudinaryConfig
};
