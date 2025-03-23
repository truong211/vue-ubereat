const db = require('../models');
const Banner = db.Banner;
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage for banner images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../frontend/public/images/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Chỉ hỗ trợ các tệp hình ảnh: jpeg, jpg, png, gif!"));
  }
}).single('image');

// Create a new banner
exports.create = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).send({
        message: "Vui lòng tải lên hình ảnh cho banner!"
      });
    }
    
    try {
      // Format image path for database
      const imagePath = `/images/banners/${req.file.filename}`;
      
      const banner = await Banner.create({
        ...req.body,
        image: imagePath
      });
      
      res.status(201).send(banner);
    } catch (error) {
      res.status(500).send({
        message: error.message || "Đã xảy ra lỗi khi tạo banner."
      });
    }
  });
};

// Retrieve all banners with filtering
exports.findAll = async (req, res) => {
  try {
    const { position, active } = req.query;
    
    let condition = {};
    
    if (position) {
      condition.position = position;
    }
    
    if (active !== undefined) {
      condition.active = active === 'true';
      
      // Add date filtering for active banners
      if (active === 'true') {
        const currentDate = new Date();
        condition[Op.and] = [
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: currentDate } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: currentDate } }
            ]
          }
        ];
      }
    }
    
    const banners = await Banner.findAll({
      where: condition,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });
    
    res.send(banners);
  } catch (error) {
    res.status(500).send({
      message: error.message || "Đã xảy ra lỗi khi lấy danh sách banner."
    });
  }
};

// Find a single banner by id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).send({
        message: `Không tìm thấy banner với ID=${id}.`
      });
    }
    
    res.send(banner);
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi lấy banner với ID=${req.params.id}`
    });
  }
};

// Update a banner
exports.update = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({
        message: err.message
      });
    }
    
    try {
      const id = req.params.id;
      
      // Get current banner to check if image needs to be updated
      const currentBanner = await Banner.findByPk(id);
      
      if (!currentBanner) {
        return res.status(404).send({
          message: `Không tìm thấy banner với ID=${id}.`
        });
      }
      
      // Build update data
      let updateData = { ...req.body };
      
      // Update image if new one is uploaded
      if (req.file) {
        // Format image path for database
        updateData.image = `/images/banners/${req.file.filename}`;
        
        // Delete old image if it exists
        if (currentBanner.image) {
          const oldImagePath = path.join(
            __dirname, 
            '../../frontend/public',
            currentBanner.image
          );
          
          // Check if file exists before attempting to delete
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      
      // Update banner in database
      await Banner.update(updateData, {
        where: { id }
      });
      
      res.send({
        message: "Banner đã được cập nhật thành công."
      });
    } catch (error) {
      res.status(500).send({
        message: error.message || `Đã xảy ra lỗi khi cập nhật banner với ID=${req.params.id}`
      });
    }
  });
};

// Delete a banner
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get banner to delete its image
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return res.status(404).send({
        message: `Không tìm thấy banner với ID=${id}.`
      });
    }
    
    // Delete the image file
    if (banner.image) {
      const imagePath = path.join(
        __dirname, 
        '../../frontend/public',
        banner.image
      );
      
      // Check if file exists before attempting to delete
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete banner from database
    await Banner.destroy({
      where: { id }
    });
    
    res.send({
      message: "Banner đã được xóa thành công!"
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || `Đã xảy ra lỗi khi xóa banner với ID=${req.params.id}`
    });
  }
};