const express = require('express');
const {
  createRequest,
  getRequests,
  deleteRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(createRequest).get(protect, getRequests);
router.route('/:id').delete(protect, deleteRequest);

module.exports = router;
