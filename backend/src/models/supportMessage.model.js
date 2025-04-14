'use strict';

module.exports = (sequelize, DataTypes) => {
  const SupportMessage = sequelize.define('SupportMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isInternal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attachments: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('attachments');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('attachments', Array.isArray(value) ? JSON.stringify(value) : value);
      }
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'support_messages',
    timestamps: true
  });

  SupportMessage.associate = function(models) {
    if (models.SupportTicket) {
      SupportMessage.belongsTo(models.SupportTicket, {
        foreignKey: 'ticketId',
        as: 'ticket'
      });
    }
    
    if (models.User) {
      SupportMessage.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });
    }
  };

  return SupportMessage;
};
