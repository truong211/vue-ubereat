const express = require('express');
const router = express.Router();
const articles = require('../controllers/article.controller');
const { authJwt } = require('../middleware');

module.exports = app => {
  // Create a new article - admin only
  router.post('/', [authJwt.verifyToken, authJwt.isAdmin], articles.create);

  // Retrieve all articles with filters and pagination
  router.get('/', articles.findAll);

  // Retrieve a single article by id
  router.get('/:id', articles.findOne);

  // Retrieve an article by slug
  router.get('/slug/:slug', articles.findBySlug);

  // Update an article - admin only
  router.put('/:id', [authJwt.verifyToken, authJwt.isAdmin], articles.update);

  // Delete an article - admin only
  router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], articles.delete);

  app.use('/api/articles', router);
};