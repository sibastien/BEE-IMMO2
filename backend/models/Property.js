const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      minlength: [3, 'Le titre doit contenir au moins 3 caracteres'],
      maxlength: [120, 'Le titre ne peut pas depasser 120 caracteres']
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      minlength: [10, 'La description doit contenir au moins 10 caracteres']
    },
    price: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas etre negatif']
    },
    transactionType: {
      type: String,
      required: [true, 'Le type de transaction est obligatoire'],
      enum: {
        values: ['sale', 'rent'],
        message: 'Le type de transaction doit etre sale ou rent'
      }
    },
    propertyType: {
      type: String,
      required: [true, 'Le type de bien est obligatoire'],
      enum: {
        values: ['apartment', 'house', 'villa', 'land', 'commercial'],
        message: 'Le type de bien est invalide'
      }
    },
    city: {
      type: String,
      required: [true, 'La ville est obligatoire'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'Le quartier est obligatoire'],
      trim: true
    },
    address: {
      type: String,
      required: [true, "L'adresse est obligatoire"],
      trim: true
    },
    surface: {
      type: Number,
      required: [true, 'La surface est obligatoire'],
      min: [0, 'La surface ne peut pas etre negative']
    },
    bedrooms: {
      type: Number,
      required: [true, 'Le nombre de chambres est obligatoire'],
      min: [0, 'Le nombre de chambres ne peut pas etre negatif']
    },
    bathrooms: {
      type: Number,
      required: [true, 'Le nombre de salles de bain est obligatoire'],
      min: [0, 'Le nombre de salles de bain ne peut pas etre negatif']
    },
    garages: {
      type: Number,
      default: 0,
      min: [0, 'Le nombre de garages ne peut pas etre negatif']
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (urls) =>
          urls.every((url) => /^https?:\/\/.+/i.test(url) || /^data:image\/(png|jpe?g|webp);base64,/i.test(url)),
        message: 'Chaque image doit etre une URL ou une image upload valide'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'sold', 'rented'],
        message: 'Le statut est invalide'
      },
      default: 'available'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Property', propertySchema);
