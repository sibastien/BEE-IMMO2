const mongoose = require('mongoose');

const slugify = (value) =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Le titre est obligatoire'],
      trim: true,
      minlength: [3, 'Le titre doit contenir au moins 3 caracteres']
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      required: [true, 'Le resume est obligatoire'],
      trim: true,
      minlength: [10, 'Le resume doit contenir au moins 10 caracteres']
    },
    content: {
      type: String,
      required: [true, 'Le contenu est obligatoire'],
      trim: true,
      minlength: [30, 'Le contenu doit contenir au moins 30 caracteres']
    },
    coverImage: {
      type: String,
      trim: true,
      validate: {
        validator: (url) => !url || /^https?:\/\/.+/i.test(url),
        message: "L'image doit etre une URL valide"
      }
    },
    category: {
      type: String,
      trim: true,
      default: 'Conseils immobiliers'
    },
    author: {
      type: String,
      trim: true,
      default: 'Bee Immobilier'
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    publishedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

blogPostSchema.pre('validate', function setSlugAndPublishDate(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = slugify(this.title);
  }

  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (this.status === 'draft') {
    this.publishedAt = undefined;
  }

  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
