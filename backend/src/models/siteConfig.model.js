module.exports = (sequelize, DataTypes) => {
  const SiteConfig = sequelize.define('SiteConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metaTags: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'site_config',
    timestamps: true // Enabling timestamps for createdAt and updatedAt
  });

  return SiteConfig;
};