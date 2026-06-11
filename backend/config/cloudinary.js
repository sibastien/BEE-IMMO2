const cloudinary = require('cloudinary').v2;

const hasManualCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const getCloudinaryUrlConfig = () => {
  if (!process.env.CLOUDINARY_URL) {
    return null;
  }

  try {
    const url = new URL(process.env.CLOUDINARY_URL);

    if (
      url.protocol !== 'cloudinary:' ||
      !url.username ||
      !url.password ||
      !url.hostname
    ) {
      return null;
    }

    return {
      cloud_name: url.hostname,
      api_key: decodeURIComponent(url.username),
      api_secret: decodeURIComponent(url.password)
    };
  } catch (error) {
    return null;
  }
};

const getMissingCloudinaryConfig = () => {
  if (hasManualCloudinaryConfig() || getCloudinaryUrlConfig()) {
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
  if (hasManualCloudinaryConfig()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    return true;
  }

  const cloudinaryUrlConfig = getCloudinaryUrlConfig();

  if (cloudinaryUrlConfig) {
    cloudinary.config({
      ...cloudinaryUrlConfig,
      secure: true
    });
    return true;
  }

  return false;
};

const getCloudinaryConfigSource = () => {
  if (hasManualCloudinaryConfig()) {
    return 'manual_variables';
  }

  if (getCloudinaryUrlConfig()) {
    return 'cloudinary_url';
  }

  if (process.env.CLOUDINARY_URL) {
    return 'invalid_cloudinary_url';
  }

  return 'missing';
};

const assertCloudinaryConfigured = () => {
  if (configureCloudinary()) {
    return;
  }

  if (process.env.CLOUDINARY_URL && !getCloudinaryUrlConfig()) {
    throw new Error('Configuration Cloudinary invalide: CLOUDINARY_URL doit respecter cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
  }

  const missing = getMissingCloudinaryConfig().join(', ');
  throw new Error(`Configuration Cloudinary manquante: ${missing}`);
};

module.exports = {
  assertCloudinaryConfigured,
  cloudinary,
  configureCloudinary,
  getCloudinaryConfigSource,
  getMissingCloudinaryConfig,
  hasCloudinaryConfig
};
