const express = require('express');
const {
  getPublicTestimonials,
  getAdminTestimonials,
  getAdminTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPublicTestimonials);
router.get('/admin', protect, getAdminTestimonials);
router.get('/admin/:id', protect, getAdminTestimonialById);
router.post('/', protect, createTestimonial);
router.put('/:id', protect, updateTestimonial);
router.delete('/:id', protect, deleteTestimonial);

module.exports = router;
