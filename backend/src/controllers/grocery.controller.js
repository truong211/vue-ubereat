const { getDb } = require('../models');
const { Op } = require('sequelize');

let Grocery = null;

// Initialize the controller
const initialize = async () => {
  console.log('Initializing grocery controller...');
  const initializedDb = await getDb();
  Grocery = initializedDb.Grocery;
  if (!Grocery) {
    throw new Error('Grocery model not found after initialization');
  }
  console.log('Grocery controller initialized successfully');
};

// Wrapper for controller methods to ensure initialization
const wrapMethod = (fn) => async (req, res, next) => {
  try {
    if (!Grocery) {
      await initialize();
    }
    return await fn(req, res, next);
  } catch (error) {
    console.error('Method execution failed:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create controller object with all methods
const groceryController = {
  // Create a new grocery item
  createGrocery: wrapMethod(async (req, res) => {
    try {
      const grocery = await Grocery.create(req.body);
      res.status(201).json({
        status: 'success',
        data: {
          grocery
        }
      });
    } catch (error) {
      console.error('Error in createGrocery:', error);
      res.status(500).json({
        message: 'Error creating grocery item',
        error: error.message
      });
    }
  }),

  // Get all groceries with filtering and pagination
  getAllGroceries: wrapMethod(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        search = '',
        category,
        sortBy = 'recommended',
        order = 'desc'
      } = req.query;

      // Build filter conditions
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      if (category) {
        whereClause.category = Array.isArray(category) 
          ? { [Op.in]: category }
          : category;
      }

      // Calculate offset
      const offset = (page - 1) * limit;

      // Get groceries with pagination
      const { count, rows } = await Grocery.findAndCountAll({
        where: whereClause,
        order: [[sortBy, order.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Calculate total pages
      const totalPages = Math.ceil(count / limit);

      res.json({
        items: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error in getAllGroceries:', error);
      res.status(500).json({
        message: 'Error fetching groceries',
        error: error.message
      });
    }
  }),

  // Get grocery categories
  getCategories: wrapMethod(async (req, res) => {
    try {
      const categories = await Grocery.findAll({
        attributes: [
          'category',
          [Grocery.sequelize.fn('COUNT', 'category'), 'count']
        ],
        group: ['category']
      });
      res.json(categories);
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({
        message: 'Error fetching categories',
        error: error.message
      });
    }
  }),

  // Get grocery by ID
  getGroceryById: wrapMethod(async (req, res) => {
    try {
      const grocery = await Grocery.findByPk(req.params.id);
      if (!grocery) {
        return res.status(404).json({ message: 'Grocery not found' });
      }
      res.json(grocery);
    } catch (error) {
      console.error('Error in getGroceryById:', error);
      res.status(500).json({
        message: 'Error fetching grocery item',
        error: error.message
      });
    }
  }),

  // Update grocery
  updateGrocery: wrapMethod(async (req, res) => {
    try {
      const grocery = await Grocery.findByPk(req.params.id);
      if (!grocery) {
        return res.status(404).json({ message: 'Grocery not found' });
      }
      await grocery.update(req.body);
      res.json(grocery);
    } catch (error) {
      console.error('Error in updateGrocery:', error);
      res.status(500).json({
        message: 'Error updating grocery item',
        error: error.message
      });
    }
  }),

  // Delete grocery
  deleteGrocery: wrapMethod(async (req, res) => {
    try {
      const grocery = await Grocery.findByPk(req.params.id);
      if (!grocery) {
        return res.status(404).json({ message: 'Grocery not found' });
      }
      await grocery.destroy();
      res.json({ message: 'Grocery deleted successfully' });
    } catch (error) {
      console.error('Error in deleteGrocery:', error);
      res.status(500).json({
        message: 'Error deleting grocery item',
        error: error.message
      });
    }
  })
};

module.exports = groceryController;

// Initialize the controller when the module is loaded
initialize().catch(error => {
  console.error('Failed to initialize grocery controller:', error);
  process.exit(1);
});