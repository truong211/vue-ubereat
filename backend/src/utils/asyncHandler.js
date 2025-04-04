/**
 * Wraps an async function and catches any errors, then passes them to Express's next() function
 * This eliminates the need for try/catch blocks in route handlers
 * 
 * @param {Function} fn Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler; 