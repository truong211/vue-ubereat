const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('article', {
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
      type: DataTypes.JSON,
      defaultValue: []
    },
    categories: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
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
  Article.associate = function(models) {
    // Commented out associations to fix loading issues
    // Article.belongsTo(models.User, {
    //   foreignKey: 'authorId',
    //   as: 'author'
    // });
  };

  return Article;
};