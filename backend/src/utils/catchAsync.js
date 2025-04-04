/**
 * Higher-order function that wraps async functions to eliminate try-catch blocks
 * This function catches any errors and passes them to the next middleware
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
module.exports = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 