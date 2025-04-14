/**
 * Script to fix model association errors
 * This specifically addresses the issue with ReviewVote model
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../models');
const { sequelize } = require('../config/database');

async function fixAssociations() {
  try {
    console.log('Starting script to fix model associations...');
    
    // Check if we can access the ReviewVote model through db
    if (!db.ReviewVote) {
      console.log('ReviewVote model not found in db object. This might be causing association errors.');
      
      // Attempt to load it directly (this ensures we get the right code)
      try {
        const ReviewVoteModel = require('../models/reviewVote.model.js')(sequelize, db.Sequelize.DataTypes);
        db.ReviewVote = ReviewVoteModel;
        console.log('ReviewVote model loaded manually');
        
        // Set up associations
        if (typeof ReviewVoteModel.associate === 'function') {
          ReviewVoteModel.associate(db);
          console.log('ReviewVote associations set up manually');
        }
      } catch (error) {
        console.error('Failed to manually load ReviewVote model:', error);
      }
    }
    
    // Fix Review model's association with ReviewVote
    if (db.Review && db.ReviewVote) {
      try {
        // Check if the association is already set up
        const associationExists = db.Review.associations && 
          db.Review.associations.votes && 
          db.Review.associations.votes.target === db.ReviewVote;
          
        if (!associationExists) {
          console.log('Setting up Review -> ReviewVote association manually');
          db.Review.hasMany(db.ReviewVote, {
            foreignKey: 'reviewId',
            as: 'votes',
            onDelete: 'CASCADE'
          });
        }
      } catch (error) {
        console.error('Error fixing Review -> ReviewVote association:', error);
      }
    }
    
    // Fix Product model's association with Review
    if (db.Product && db.Review) {
      try {
        // Check if the association is already set up
        const associationExists = db.Product.associations && 
          db.Product.associations.reviews && 
          db.Product.associations.reviews.target === db.Review;
          
        if (!associationExists) {
          console.log('Setting up Product -> Review association manually');
          db.Product.hasMany(db.Review, {
            foreignKey: 'productId',
            as: 'reviews'
          });
        }
      } catch (error) {
        console.error('Error fixing Product -> Review association:', error);
      }
    }
    
    // Fix Order model's association with Review
    if (db.Order && db.Review) {
      try {
        // Check if the association is already set up  
        const associationExists = db.Order.associations && 
          db.Order.associations.review && 
          db.Order.associations.review.target === db.Review;
          
        if (!associationExists) {
          console.log('Setting up Order -> Review association manually');
          db.Order.hasOne(db.Review, {
            foreignKey: 'orderId',
            as: 'review',
            onDelete: 'SET NULL'
          });
        }
      } catch (error) {
        console.error('Error fixing Order -> Review association:', error);
      }
    }
    
    console.log('Association fixes completed!');
    
    // Return success with list of models
    const modelNames = Object.keys(db).filter(key => 
      typeof db[key] === 'function' && 
      db[key].prototype && 
      db[key].prototype.constructor.name !== 'Sequelize'
    );
    
    console.log(`Available models: ${modelNames.join(', ')}`);
    console.log('Association fix script completed successfully!');
    
  } catch (error) {
    console.error('Error fixing associations:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixAssociations()
    .then(() => {
      console.log('Association fix script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Association fix script failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = fixAssociations;
}