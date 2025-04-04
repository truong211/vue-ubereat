const jwt = require('jsonwebtoken');
const config = require('../config');

const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, config.jwtSecret);
            if (!decoded.role) {
                return res.status(403).json({ message: 'Role not specified in token' });
            }

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};

const roles = {
    ADMIN: 'admin',
    RESTAURANT: 'restaurant',
    CUSTOMER: 'customer'
};

const checkRole = verifyRole;

module.exports = {
    checkRole,
    roles
};