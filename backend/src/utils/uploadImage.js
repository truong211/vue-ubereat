/**
 * Utility function to handle image uploads
 * @param {Object} file - The uploaded file object
 * @param {String} destination - The destination directory
 * @returns {Promise<String>} The URL of the uploaded image
 */
const uploadImage = async (file, destination = 'uploads') => {
  try {
    if (!file) return null;
    
    // In a real implementation, this would handle saving the file,
    // potentially to cloud storage, and return a URL
    // For now, we'll just return the path where the file would be saved
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/${destination}/${file.filename}`;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

module.exports = uploadImage; 