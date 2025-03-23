const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Article extends Model {}

Article.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('news', 'blog', 'guide', 'faq'),
    defaultValue: 'news'
  },
  featuredImage: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  categories: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      metaTitle: null,
      metaDescription: null,
      openGraphImage: null
    }
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'vi'
  },
  isHighlighted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'Article',
  tableName: 'articles',
  timestamps: true,
  indexes: [
    {
      fields: ['slug'],
      unique: true
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['authorId']
    },
    {
      fields: ['publishedAt']
    }
  ]
});

// Define associations
Article.associate = (models) => {
  Article.belongsTo(models.User, {
    foreignKey: 'authorId',
    as: 'author'
  });
};

module.exports = Article;