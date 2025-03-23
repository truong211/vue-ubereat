const db = require('../models');
const Article = db.Article;
const User = db.User;
const { Op } = require('sequelize');
const slugify = require('slugify');

// Create a new article
exports.create = async (req, res) => {
  try {
    // Generate slug from title
    const slug = slugify(req.body.title, {
      lower: true,
      strict: true
    });
    
    const article = await Article.create({
      ...req.body,
      slug,
      authorId: req.userId
    });
    
    res.status(201).send(article);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi tạo bài viết."
    });
  }
};

// Retrieve all articles with pagination and filtering
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, published, search } = req.query;
    const offset = (page - 1) * limit;
    
    let condition = {};
    
    if (type) {
      condition.type = type;
    }
    
    if (published !== undefined) {
      condition.published = published === 'true';
    }
    
    if (search) {
      condition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await Article.findAndCountAll({
      where: condition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    res.send({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      articles: rows
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy danh sách bài viết."
    });
  }
};

// Find a single article by id
exports.findOne = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!article) {
      return res.status(404).send({
        message: `Không tìm thấy bài viết với ID=${req.params.id}.`
      });
    }
    
    res.send(article);
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi lấy bài viết với ID=${req.params.id}`
    });
  }
};

// Find an article by slug
exports.findBySlug = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!article) {
      return res.status(404).send({
        message: `Không tìm thấy bài viết với slug=${req.params.slug}.`
      });
    }
    
    res.send(article);
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi lấy bài viết với slug=${req.params.slug}`
    });
  }
};

// Update an article
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // If title is changed, update the slug
    let updateData = { ...req.body };
    if (req.body.title) {
      updateData.slug = slugify(req.body.title, {
        lower: true,
        strict: true
      });
    }
    
    const num = await Article.update(updateData, {
      where: { id }
    });
    
    if (num == 1) {
      res.send({
        message: "Bài viết đã được cập nhật thành công."
      });
    } else {
      res.status(404).send({
        message: `Không thể cập nhật bài viết với ID=${id}. Có thể bài viết không tồn tại!`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi cập nhật bài viết với ID=${req.params.id}`
    });
  }
};

// Delete an article
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const num = await Article.destroy({
      where: { id }
    });
    
    if (num == 1) {
      res.send({
        message: "Bài viết đã được xóa thành công!"
      });
    } else {
      res.status(404).send({
        message: `Không thể xóa bài viết với ID=${id}. Có thể bài viết không tồn tại!`
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi xóa bài viết với ID=${req.params.id}`
    });
  }
};