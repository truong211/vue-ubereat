const express = require('express');
const router = express.Router();
const { getDb } = require('../models');

let models = null;
const initializeModels = async () => {
  if (!models) {
    models = await getDb();
  }
  return models;
};

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    // Initialize models
    models = await initializeModels();
    if (!models || !models.Category) {
      throw new Error('Category model not initialized');
    }

    const categories = await models.Category.findAll({
      where: {
        isActive: true
      },
      attributes: ['id', 'name', 'description', 'image'],
      order: [['displayOrder', 'ASC']]
    });

    res.json({
      items: categories,
      total: categories.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;