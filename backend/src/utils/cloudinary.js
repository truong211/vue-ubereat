/**
 * Mock Cloudinary integration module
 * In a real implementation, this would integrate with Cloudinary's API
 */

// Mock configuration
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
};

/**
 * Upload an image to Cloudinary (mock implementation)
 * @param {String} imagePath - Path to the image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Result of the upload
 */
const uploadImage = async (imagePath, options = {}) => {
  try {
    // In a real implementation, this would call Cloudinary's API
    // For now, return a mock result
    return {
      public_id: `mock_${Date.now()}`,
      secure_url: `https://res.cloudinary.com/${config.cloud_name}/image/upload/mock_${Date.now()}.jpg`,
      format: 'jpg',
      width: 800,
      height: 600
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary (mock implementation)
 * @param {String} publicId - Public ID of the image
 * @returns {Promise<Object>} - Result of the deletion
 */
const deleteImage = async (publicId) => {
  try {
    // In a real implementation, this would call Cloudinary's API
    // For now, return a mock result
    return {
      result: 'ok'
    };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  config,
  uploadImage,
  deleteImage
}; 