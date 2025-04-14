'use strict';

module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    category: {
      type: DataTypes.ENUM('account', 'order', 'payment', 'delivery', 'restaurant', 'app', 'other'),
      defaultValue: 'other'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastResponseAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'support_tickets',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  SupportTicket.associate = function(models) {
    if (models.User) {
      SupportTicket.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      SupportTicket.belongsTo(models.User, {
        foreignKey: 'assignedTo',
        as: 'assignedToUser'
      });
      
      SupportTicket.belongsTo(models.User, {
        foreignKey: 'closedBy',
        as: 'closedByUser'
      });
    }
    
    if (models.Order) {
      SupportTicket.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
    
    if (models.SupportMessage) {
      SupportTicket.hasMany(models.SupportMessage, {
        foreignKey: 'ticketId',
        as: 'messages'
      });
    }
  };

  return SupportTicket;
};
