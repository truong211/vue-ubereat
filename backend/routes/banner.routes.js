const express = require('express');
const router = express.Router();
const banners = require('../controllers/banner.controller');
const { authJwt } = require('../middleware');

module.exports = app => {
  // Create a new banner - admin only
  router.post('/', [authJwt.verifyToken, authJwt.isAdmin], banners.create);

  // Retrieve all banners with filtering options
  router.get('/', banners.findAll);

  // Retrieve a single banner by id
  router.get('/:id', banners.findOne);

  // Update a banner - admin only
  router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], banners.update);

  // Delete a banner - admin only
  router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], banners.delete);

  app.use('/api/banners', router);
};