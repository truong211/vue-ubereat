const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Require authentication for all profile routes
router.use(authMiddleware);

// -----------------------------------------------------------------------------
// GET /api/v1/profile  – Fetch logged-in user profile
// -----------------------------------------------------------------------------
router.get('/', userController.getProfile);

// -----------------------------------------------------------------------------
// PUT /api/v1/profile  – Update basic fields (name, email, phone, ...)
// -----------------------------------------------------------------------------
router.put(
  '/',
  [
    body('fullName')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Full name must be between 3 and 100 characters'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number')
  ],
  userController.updateProfile
);

// -----------------------------------------------------------------------------
// POST /api/v1/profile/avatar  – Upload avatar image (multipart/form-data)
// -----------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5 MB default
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const isValid = allowed.test(path.extname(file.originalname).toLowerCase()) &&
                    allowed.test(file.mimetype);
    isValid ? cb(null, true) : cb(new Error('Only image files are allowed!'));
  }
});

router.post('/avatar', upload.single('avatar'), userController.uploadProfileImage);

module.exports = router;