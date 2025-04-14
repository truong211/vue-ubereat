'use strict';

module.exports = (sequelize, DataTypes) => {
  const StaticPage = sequelize.define('StaticPage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    meta_title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    publish_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_edited_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    page_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'static_pages',
    timestamps: true
  });

  StaticPage.associate = function(models) {
    if (models.User) {
      StaticPage.belongsTo(models.User, {
        foreignKey: 'last_edited_by',
        as: 'editor'
      });
    }
  };

  return StaticPage;
};