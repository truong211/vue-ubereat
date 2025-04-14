'use strict';

const { DataTypes } = require('sequelize');

console.log('<<<< LOADING FINAL ATTEMPT reviewReport.js MODEL (Explicit FK Object) >>>>');

module.exports = (sequelize, DataTypes) => {
  const ReviewReport = sequelize.define('ReviewReport', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true
    },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false
    },
    review_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false
    },
    reason: { 
      type: DataTypes.STRING(255), 
      allowNull: false
    },
    description: { 
      type: DataTypes.TEXT, 
      allowNull: true
    },
    status: { 
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved'), 
      defaultValue: 'pending'
    },
    moderator_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true
    },
    resolved_at: { 
      type: DataTypes.DATE, 
      allowNull: true
    },
    created_at: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW
    },
    updated_at: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW
    }
  }, {
    modelName: 'ReviewReport',
    tableName: 'review_reports',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_review_reports_status',
        fields: ['status']
      },
      {
        name: 'idx_review_reports_review_id',
        fields: ['review_id']
      },
      {
        name: 'idx_review_reports_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_review_reports_moderator_id',
        fields: ['moderator_id']
      }
    ]
  });

  ReviewReport.associate = function(models) {
    ReviewReport.belongsTo(models.Review, {
      foreignKey: 'review_id',
      as: 'review',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    ReviewReport.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'reporter',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    ReviewReport.belongsTo(models.User, {
      foreignKey: 'moderator_id',
      as: 'moderator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  };

  return ReviewReport;
};
