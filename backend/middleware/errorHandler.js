const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Erreur serveur';
  const errors = err.errors || {};

  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // ID MongoDB invalide
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID invalide';
  }

  // Erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Erreur de validation';

    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(Object.keys(errors).length > 0 && { errors })
  });
};

module.exports = errorHandler;
