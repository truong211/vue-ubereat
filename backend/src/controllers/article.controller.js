const { Article } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const slugify = require('slugify');

// Configure multer for article images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/articles');
  },
  filename: (req, file, cb) => {
    cb(null, `article-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new AppError('Only image files (jpeg, jpg, png, gif, webp) are allowed!', 400));
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('featuredImage');

// Get articles with filtering and pagination
exports.findAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status = 'published',
      search,
      language = 'vi',
      category,
      tag,
      highlighted
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Add filters
    if (type) where.type = type;
    if (status) where.status = status;
    if (language) where.language = language;
    if (highlighted) where.isHighlighted = true;
    
    // Category and tag filtering now handled at database level
    if (category) {
      // We'll handle this differently in SQL - this is a placeholder
      // For JSON array fields, we need specific SQL syntax
      // This will be handled in our Article model's getWithAuthor method
    }
    
    if (tag) {
      // Similar to category, handled in the model
    }
    
    // Search handled differently with SQL
    const searchTerm = search ? `%${search}%` : null;

    // Use our direct SQL model method
    const articles = await Article.getWithAuthor({
      where,
      search: searchTerm,
      order: [
        ['isHighlighted', 'DESC'],
        ['sortOrder', 'ASC'],
        ['publishedAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Count total articles with the same filters
    const countResult = await Article.query(
      `SELECT COUNT(*) as total FROM articles WHERE 
      ${type ? 'type = ? AND ' : ''} 
      ${status ? 'status = ? AND ' : ''} 
      ${language ? 'language = ? AND ' : ''} 
      ${highlighted ? 'isHighlighted = true AND ' : ''} 
      1=1`,
      [type, status, language].filter(Boolean)
    );
    
    const count = countResult[0].total;

    res.json({
      status: 'success',
      data: {
        articles,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalArticles: count
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single article by slug
exports.findBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug },
      include: true // This tells our model to include author information
    });

    if (!article) {
      return next(new AppError('Article not found', 404));
    }

    // Increment view count with direct SQL
    await Article.update({ viewCount: article.viewCount + 1 }, { where: { id: article.id } });

    res.json({
      status: 'success',
      data: { article }
    });
  } catch (error) {
    next(error);
  }
};

// Create new article
exports.create = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new AppError('Validation error', 400, errors.array()));
      }

      const {
        title,
        content,
        type = 'news',
        excerpt,
        tags = [],
        categories = [],
        metadata = {},
        language = 'vi',
        status = 'draft',
        isHighlighted = false,
        sortOrder = 0
      } = req.body;

      // Generate slug from title
      const slug = slugify(title, {
        lower: true,
        strict: true
      });

      // Create article with direct SQL
      const article = await Article.create({
        title,
        slug,
        content,
        type,
        excerpt: excerpt || content.substring(0, 200),
        featuredImage: req.file ? `/uploads/articles/${req.file.filename}` : null,
        authorId: req.user.id,
        tags: JSON.stringify(tags),
        categories: JSON.stringify(categories),
        metadata: JSON.stringify(metadata),
        language,
        status,
        isHighlighted,
        sortOrder,
        publishedAt: status === 'published' ? new Date() : null
      });

      res.status(201).json({
        status: 'success',
        data: { article }
      });
    });
  } catch (error) {
    next(error);
  }
};

// Update article
exports.update = async (req, res, next) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }

      const { id } = req.params;
      const article = await Article.findByPk(id);

      if (!article) {
        return next(new AppError('Article not found', 404));
      }

      const {
        title,
        content,
        type,
        excerpt,
        tags,
        categories,
        metadata,
        language,
        status,
        isHighlighted,
        sortOrder
      } = req.body;

      // Update slug if title changes
      const slug = title ? slugify(title, { lower: true, strict: true }) : article.slug;

      // Prepare update data
      const updateData = {
        title: title || article.title,
        slug,
        content: content || article.content,
        type: type || article.type,
        excerpt: excerpt || article.excerpt,
        tags: tags || article.tags,
        categories: categories || article.categories,
        metadata: { ...article.metadata, ...metadata },
        language: language || article.language,
        isHighlighted: isHighlighted !== undefined ? isHighlighted : article.isHighlighted,
        sortOrder: sortOrder !== undefined ? sortOrder : article.sortOrder
      };

      // Update featured image if provided
      if (req.file) {
        updateData.featuredImage = `/uploads/articles/${req.file.filename}`;
      }

      // Update published date if status changes to published
      if (status === 'published' && article.status !== 'published') {
        updateData.publishedAt = new Date();
      }
      updateData.status = status || article.status;

      await article.update(updateData);

      res.json({
        status: 'success',
        data: { article }
      });
    });
  } catch (error) {
    next(error);
  }
};

// Delete article
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    
    if (!article) {
      return next(new AppError('Article not found', 404));
    }

    await article.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Get article statistics
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Article.findAll({
      attributes: [
        'type',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type', 'status']
    });

    const totalViews = await Article.sum('viewCount');

    res.json({
      status: 'success',
      data: {
        stats,
        totalViews
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update article status
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return next(new AppError('Article not found', 404));
    }

    const updateData = {
      status,
      publishedAt: status === 'published' && !article.publishedAt ? new Date() : article.publishedAt
    };

    await article.update(updateData);

    res.json({
      status: 'success',
      data: { article }
    });
  } catch (error) {
    next(error);
  }
};