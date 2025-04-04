/**
 * Utility functions for handling reviews
 */

/**
 * Calculate average rating from review scores
 * @param {Array} reviews - Array of review objects
 * @returns {Number} - Average rating rounded to 1 decimal place
 */
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
};

/**
 * Generate rating distribution from reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Object} - Distribution of ratings (1-5 stars)
 */
const getRatingDistribution = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 };
  }
  
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  reviews.forEach(review => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });
  
  return {
    ...distribution,
    total: reviews.length
  };
};

/**
 * Filter inappropriate content from review text
 * @param {String} text - Review text
 * @returns {String} - Filtered text
 */
const filterInappropriateContent = (text) => {
  if (!text) return '';
  
  // Simple word filtering example (would be more sophisticated in production)
  const inappropriateWords = ['badword1', 'badword2', 'badword3'];
  let filteredText = text;
  
  inappropriateWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '***');
  });
  
  return filteredText;
};

module.exports = {
  calculateAverageRating,
  getRatingDistribution,
  filterInappropriateContent
}; 