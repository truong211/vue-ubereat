const express = require('express');
const router = express.Router();
const { Review, Restaurant } = require('../models');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/reviews/user?page=1
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Restaurant,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      total: count,
      page,
      pageCount: Math.ceil(count / limit),
      reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Error fetching user reviews' });
  }
});

module.exports = router;