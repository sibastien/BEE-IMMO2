const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Le nom du client est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caracteres']
    },
    context: {
      type: String,
      trim: true,
      default: 'Client Bee Solution & Consulting'
    },
    quote: {
      type: String,
      required: [true, 'Le temoignage est obligatoire'],
      trim: true,
      minlength: [10, 'Le temoignage doit contenir au moins 10 caracteres']
    },
    rating: {
      type: Number,
      min: [1, 'La note minimale est 1'],
      max: [5, 'La note maximale est 5'],
      default: 5
    },
    featured: {
      type: Boolean,
      default: false
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
