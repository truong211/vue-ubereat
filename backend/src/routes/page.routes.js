const express = require('express');
const router = express.Router();
const { getPages, getPageBySlug } = require('../controllers/page.controller');

// Public routes
router.get('/', getPages);
router.get('/:slug', getPageBySlug);

module.exports = router;