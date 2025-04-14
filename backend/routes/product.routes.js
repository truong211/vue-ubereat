const express = require('express');
const router = express.Router();
const db = require('../models');
const Product = db.Product;
const { Op } = require('sequelize');

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 8,
      sort = 'popular',
      onSale = false,
      page = 1
    } = req.query;

    const offset = (page - 1) * limit;
    let order = [['createdAt', 'DESC']];
    
    if (sort === 'popular') {
      order = [[db.sequelize.literal('(SELECT COUNT(*) FROM orders WHERE "productId" = "Product"."id")'), 'DESC']];
    }

    const where = {
      isAvailable: true
    };

    if (onSale === 'true') {
      where.discountPrice = {
        [Op.not]: null
      };
    }

    const products = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      include: [
        {
          model: db.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name', 'logo', 'estimatedDeliveryTime']
        }
      ]
    });

    res.json({
      items: products.rows,
      total: products.count,
      page: parseInt(page),
      pages: Math.ceil(products.count / limit)
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get recommended products
router.get('/recommended', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.findAll({
      where: {
        isAvailable: true
      },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.Restaurant,
          as: 'restaurant',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json(products);
  } catch (err) {
    console.error('Error fetching recommended products:', err);
    res.status(500).json({ message: 'Error fetching recommended products' });
  }
});

module.exports = router;