const { logPromotionError } = require('../utils/promotionLogger');

const promotionErrorHandler = (err, req, res, next) => {
  // Log the error with context
  logPromotionError(err, {
    url: req.originalUrl,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body,
    userId: req.user?.id
  });

  // Handle specific promotion-related errors
  if (err.name === 'PromotionValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message,
      code: 'PROMOTION_VALIDATION_ERROR'
    });
  }

  if (err.name === 'PromotionLimitExceeded') {
    return res.status(400).json({
      status: 'error',
      message: 'Promotion usage limit exceeded',
      code: 'PROMOTION_LIMIT_EXCEEDED'
    });
  }

  if (err.name === 'PromotionExpired') {
    return res.status(400).json({
      status: 'error',
      message: 'Promotion has expired',
      code: 'PROMOTION_EXPIRED'
    });
  }

  if (err.name === 'PromotionNotFound') {
    return res.status(404).json({
      status: 'error',
      message: 'Promotion not found',
      code: 'PROMOTION_NOT_FOUND'
    });
  }

  if (err.name === 'CampaignBudgetExceeded') {
    return res.status(400).json({
      status: 'error',
      message: 'Campaign budget limit reached',
      code: 'CAMPAIGN_BUDGET_EXCEEDED'
    });
  }

  // Pass to default error handler for unhandled errors
  next(err);
};

// Custom error classes
class PromotionValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PromotionValidationError';
  }
}

class PromotionLimitExceeded extends Error {
  constructor(message = 'Promotion usage limit exceeded') {
    super(message);
    this.name = 'PromotionLimitExceeded';
  }
}

class PromotionExpired extends Error {
  constructor(message = 'Promotion has expired') {
    super(message);
    this.name = 'PromotionExpired';
  }
}

class PromotionNotFound extends Error {
  constructor(message = 'Promotion not found') {
    super(message);
    this.name = 'PromotionNotFound';
  }
}

class CampaignBudgetExceeded extends Error {
  constructor(message = 'Campaign budget limit reached') {
    super(message);
    this.name = 'CampaignBudgetExceeded';
  }
}

module.exports = {
  promotionErrorHandler,
  PromotionValidationError,
  PromotionLimitExceeded,
  PromotionExpired,
  PromotionNotFound,
  CampaignBudgetExceeded
};