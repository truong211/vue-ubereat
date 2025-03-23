'use strict';

module.exports = (sequelize, DataTypes) => {
  const Article = sequelize.define('Article', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('news', 'faq', 'guide'),
      defaultValue: 'news'
    },
    category: {
      type: DataTypes.STRING
    },
    image: {
      type: DataTypes.STRING
    },
    published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    publishedAt: {
      type: DataTypes.DATE
    },
    metaTitle: {
      type: DataTypes.STRING
    },
    metaDescription: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'articles'
  });

  Article.associate = function(models) {
    Article.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
  };

  return Article;
};