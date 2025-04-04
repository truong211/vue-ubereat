/**
 * Helper utility functions for the application
 */

/**
 * Generate a unique order number
 * @returns {string} - unique order number with format ORD-YYYY-MM-DD-XXXXX
 */
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Format currency to display in UI
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format date to display in UI
 * @param {Date|string} date - Date to format
 * @param {string} format - Format style (default: full)
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = 'full') => {
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US');
    case 'time':
      return dateObj.toLocaleTimeString('en-US');
    case 'full':
    default:
      return dateObj.toLocaleString('en-US');
  }
};

/**
 * Truncate a string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @returns {string} - Truncated string
 */
const truncateString = (str, length = 100) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

module.exports = {
  generateOrderNumber,
  formatCurrency,
  formatDate,
  truncateString
}; 