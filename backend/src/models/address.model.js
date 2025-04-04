const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: { // Renamed from userId
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use table name string
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    address_line_1: { // Renamed from addressLine1
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address_line_2: { // Renamed from addressLine2
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
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
      allowNull: false
    },
    postal_code: { // Renamed from postalCode
      type: DataTypes.STRING(20),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Vietnam'
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    is_default: { // Renamed from isDefault
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    type: {
      type: DataTypes.ENUM('home', 'work', 'other'),
      defaultValue: 'home'
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    place_id: { // Renamed from placeId
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Google Maps or other map provider place ID'
    },
    formatted_address: { // Renamed from formattedAddress
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Fully formatted address from map provider'
    },
    has_elevator: { // Renamed from hasElevator
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    apartment_number: { // Renamed from apartmentNumber
      type: DataTypes.STRING(20),
      allowNull: true
    },
    delivery_notes: { // Renamed from deliveryNotes
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes for delivery, e.g., doorbell not working'
    },
    contact_name: { // Renamed from contactName
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_phone: { // Renamed from contactPhone
      type: DataTypes.STRING(15),
      allowNull: true
    }
    // created_at, updated_at handled by timestamps + underscored
  }, {
    timestamps: true,
    underscored: true, // Added underscored
    tableName: 'addresses', // Table name is already correct
    indexes: [
      {
        fields: ['user_id'], // Updated field name
        name: 'idx_address_user'
      },
      {
        fields: ['latitude', 'longitude'],
        name: 'idx_address_location'
      }
    ]
  });

  // Define associations using the associate method pattern
  Address.associate = function(models) {
    Address.belongsTo(models.user, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  };

  return Address;
};