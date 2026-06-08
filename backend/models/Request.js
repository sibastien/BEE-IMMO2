const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    propertyId: {
      type: String,
      required: [true, "L'annonce est obligatoire"]
    },
    propertyTitle: {
      type: String,
      required: [true, "Le titre de l'annonce est obligatoire"],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Le telephone est obligatoire'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      validate: {
        validator: (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: 'Email invalide'
      }
    },
    message: {
      type: String,
      required: [true, 'Le message est obligatoire'],
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Request', requestSchema);
