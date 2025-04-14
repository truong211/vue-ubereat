/**
 * Address model with Sequelize implementation
 */
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    addressType: {
      type: DataTypes.ENUM('home', 'work', 'other'),
      defaultValue: 'home'
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    district: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ward: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Vietnam',
      validate: {
        notEmpty: true
      }
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    deliveryInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes for delivery, e.g., doorbell not working'
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contactName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    placeId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Google Maps or other map provider place ID'
    },
    formattedAddress: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Fully formatted address from map provider'
    },
    hasElevator: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    apartmentNumber: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    tableName: 'addresses',
    timestamps: true,
    indexes: [
      {
        name: 'idx_address_user',
        fields: ['userId']
      },
      {
        fields: ['latitude', 'longitude'],
        name: 'idx_address_location'
      },
      {
        fields: ['userId', 'isDefault'],
        name: 'idx_user_default_address'
      }
    ]
  });

  Address.associate = (models) => {
    Address.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  // Hook to ensure only one default address per user
  Address.beforeCreate = async (address, options) => {
    if (address.isDefault) {
      await updateDefaultAddress(address, options);
    }
  };

  Address.beforeUpdate = async (address, options) => {
    if (address.changed('isDefault') && address.isDefault) {
      await updateDefaultAddress(address, options);
    }
  };

  // Helper function to update default address
  async function updateDefaultAddress(address, options) {
    try {
      await sequelize.models.Address.update(
        { isDefault: false },
        {
          where: {
            userId: address.userId,
            id: { [sequelize.Sequelize.Op.ne]: address.id || 0 }
          },
          transaction: options.transaction
        }
      );
    } catch (error) {
      console.error('Error updating default address status:', error);
    }
  }

  return Address;
};