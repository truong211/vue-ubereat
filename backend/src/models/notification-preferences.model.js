module.exports = (sequelize, DataTypes) => {
  const NotificationPreferences = sequelize.define('NotificationPreferences', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    smsNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        order_status: {
          email: true,
          push: true,
          sms: false
        },
        chat: {
          email: false,
          push: true,
          sms: false
        },
        promotion: {
          email: true,
          push: false,
          sms: false
        },
        system: {
          email: true,
          push: true,
          sms: false
        },
        account: {
          email: true,
          push: true,
          sms: true
        }
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'notification_preferences',
    timestamps: true
  });

  NotificationPreferences.associate = (models) => {
    NotificationPreferences.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return NotificationPreferences;
};