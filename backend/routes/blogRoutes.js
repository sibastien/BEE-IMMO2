const express = require('express');
const {
  getPublicPosts,
  getAdminPosts,
  getPostBySlug,
  getAdminPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getPublicPosts);
router.get('/admin', protect, getAdminPosts);
router.get('/admin/:id', protect, getAdminPostById);
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.get('/:slug', getPostBySlug);

module.exports = router;
