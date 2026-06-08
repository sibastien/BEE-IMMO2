const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const frontendPath = path.join(__dirname, '..', 'frontend');

connectDB();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares globaux
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origine non autorisee par CORS'));
    },
  })
);
app.use(express.json());
app.use(express.static(frontendPath));

// Routes
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: frontendPath });
});

app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: frontendPath });
});

app.get('/admin/requests', (req, res) => {
  res.sendFile('requests.html', { root: frontendPath });
});

app.get('/property/:id', (req, res) => {
  res.sendFile('property.html', { root: frontendPath });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Bee Consulting en ligne',
  });
});

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

// Gestion des erreurs
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
