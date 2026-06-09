const Testimonial = require('../models/Testimonial');

const sortTestimonials = { sortOrder: 1, createdAt: -1 };

const getPublicTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ status: 'published' }).sort(sortTestimonials);

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

const getAdminTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find().sort(sortTestimonials);

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

const getAdminTestimonialById = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      res.status(404);
      throw new Error('Temoignage introuvable');
    }

    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);

    res.status(201).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!testimonial) {
      res.status(404);
      throw new Error('Temoignage introuvable');
    }

    res.status(200).json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      res.status(404);
      throw new Error('Temoignage introuvable');
    }

    res.status(200).json({
      success: true,
      message: 'Temoignage supprime'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicTestimonials,
  getAdminTestimonials,
  getAdminTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
};
