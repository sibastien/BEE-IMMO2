const crypto = require('crypto');

const createSignature = (payload) =>
  crypto
    .createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(payload)
    .digest('hex');

const createToken = (email) => {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      exp: Date.now() + 24 * 60 * 60 * 1000
    })
  ).toString('base64url');
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expectedSignature = createSignature(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  if (Date.now() > data.exp) {
    return null;
  }

  return data;
};

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;
  const admin = verifyToken(token);

  if (!admin) {
    res.status(401);
    return next(new Error('Acces admin requis'));
  }

  req.admin = admin;
  next();
};

module.exports = {
  createToken,
  protect
};
