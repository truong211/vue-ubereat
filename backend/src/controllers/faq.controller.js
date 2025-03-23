const { FAQ } = require('../models');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/error.middleware');

/**
 * Get all FAQs
 * @route GET /api/faqs
 * @access Public
 */
exports.findAll = async (req, res, next) => {
  try {
    const faqs = await FAQ.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['order', 'ASC']]
    });

    res.status(200).json({
      status: 'success',
      data: { faqs }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new FAQ
 * @route POST /api/admin/faqs
 * @access Private (Admin)
 */
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation error', 400, errors.array()));
    }

    const { question, answer, category, order } = req.body;
    const faq = await FAQ.create({
      question,
      answer,
      category,
      order: order || 0
    });

    res.status(201).json({
      status: 'success',
      data: { faq }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update FAQ
 * @route PUT /api/admin/faqs/:id
 * @access Private (Admin)
 */
exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation error', 400, errors.array()));
    }

    const { id } = req.params;
    const { question, answer, category, order, isActive } = req.body;

    const faq = await FAQ.findByPk(id);
    if (!faq) {
      return next(new AppError('FAQ not found', 404));
    }

    await faq.update({
      question: question || faq.question,
      answer: answer || faq.answer,
      category: category || faq.category,
      order: order !== undefined ? order : faq.order,
      isActive: isActive !== undefined ? isActive : faq.isActive
    });

    res.status(200).json({
      status: 'success',
      data: { faq }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete FAQ
 * @route DELETE /api/admin/faqs/:id
 * @access Private (Admin)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByPk(id);
    
    if (!faq) {
      return next(new AppError('FAQ not found', 404));
    }

    await faq.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};