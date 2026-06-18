const express = require('express');
const { getCatalogFeed } = require('../controllers/metaCatalogController');

const router = express.Router();

router.get('/catalog-feed', getCatalogFeed);
router.get('/catalog-feed.csv', getCatalogFeed);

module.exports = router;
