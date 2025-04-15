module.exports = (sequelize, DataTypes) => {
  const NotificationPreference = sequelize.define('NotificationPreference', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    orderUpdates: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    promotions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'notification_preferences'
  });

  NotificationPreference.associate = function(models) {
    NotificationPreference.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return NotificationPreference;
}; 