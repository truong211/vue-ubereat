const express = require('express');
const router = express.Router();
const faqs = require('../controllers/faq.controller');
const { authJwt } = require('../middleware');
const { body } = require('express-validator');

// Public routes
router.get('/', faqs.findAll);

// Admin only routes
router.post('/', 
  [
    authJwt.verifyToken, 
    authJwt.isAdmin,
    body('question').notEmpty().withMessage('Question is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('order').optional().isNumeric().withMessage('Order must be a number')
  ], 
  faqs.create
);

router.put('/:id', 
  [
    authJwt.verifyToken, 
    authJwt.isAdmin,
    body('question').optional().notEmpty().withMessage('Question cannot be empty'),
    body('answer').optional().notEmpty().withMessage('Answer cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('order').optional().isNumeric().withMessage('Order must be a number')
  ], 
  faqs.update
);

router.delete('/:id', [authJwt.verifyToken, authJwt.isAdmin], faqs.delete);

module.exports = app => {
  app.use('/api/faqs', router);
};