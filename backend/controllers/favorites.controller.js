const db = require('../config/database');

const favoritesController = {
    // Get user's favorite foods
    getFavoriteFoods: async (req, res) => {
        try {
            const userId = req.user.id;
            
            const query = `
                SELECT f.*, p.name, p.description, p.price, p.image_url 
                FROM favorites f
                JOIN products p ON f.food_id = p.id
                WHERE f.user_id = ?
                AND f.is_active = true
            `;
            
            const [favorites] = await db.execute(query, [userId]);
            
            res.status(200).json({
                success: true,
                data: favorites
            });
        } catch (error) {
            console.error('Error fetching favorite foods:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch favorite foods',
                error: error.message
            });
        }
    },

    // Add a food to favorites
    addFavoriteFood: async (req, res) => {
        try {
            const userId = req.user.id;
            const { foodId } = req.params;

            // Check if already favorited
            const [existing] = await db.execute(
                'SELECT * FROM favorites WHERE user_id = ? AND food_id = ?',
                [userId, foodId]
            );

            if (existing.length > 0) {
                // If exists but not active, reactivate it
                if (!existing[0].is_active) {
                    await db.execute(
                        'UPDATE favorites SET is_active = true WHERE user_id = ? AND food_id = ?',
                        [userId, foodId]
                    );
                }
                return res.status(200).json({
                    success: true,
                    message: 'Food is already in favorites'
                });
            }

            // Add new favorite
            await db.execute(
                'INSERT INTO favorites (user_id, food_id) VALUES (?, ?)',
                [userId, foodId]
            );

            res.status(201).json({
                success: true,
                message: 'Food added to favorites'
            });
        } catch (error) {
            console.error('Error adding favorite food:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add food to favorites',
                error: error.message
            });
        }
    },

    // Remove a food from favorites
    removeFavoriteFood: async (req, res) => {
        try {
            const userId = req.user.id;
            const { foodId } = req.params;

            // Soft delete by setting is_active to false
            await db.execute(
                'UPDATE favorites SET is_active = false WHERE user_id = ? AND food_id = ?',
                [userId, foodId]
            );

            res.status(200).json({
                success: true,
                message: 'Food removed from favorites'
            });
        } catch (error) {
            console.error('Error removing favorite food:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove food from favorites',
                error: error.message
            });
        }
    }
};

module.exports = favoritesController;