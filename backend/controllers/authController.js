const { createToken } = require('../middleware/authMiddleware');

// Connexion admin simple
const loginAdmin = (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      res.status(401);
      throw new Error('Email ou mot de passe incorrect');
    }

    res.status(200).json({
      success: true,
      token: createToken(email),
      admin: { email }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminProfile = (req, res) => {
  res.status(200).json({
    success: true,
    admin: { email: req.admin.email }
  });
};

module.exports = {
  loginAdmin,
  getAdminProfile
};
