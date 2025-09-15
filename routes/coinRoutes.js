const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { submitCoin, getCoins, getAllCoins, getPendingCoins, approveCoin, rejectCoin, promoteCoin, unpromoteCoin, editCoin, deleteCoin, getCoinById, getPromotedCoins, uploadBanner, deleteBanner, getBanners, getNewCoins, getPresaleCoins, boostCoin } = require('../controllers/coinController');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_1234567890';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Token received:`, token);
  if (!token) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] No token provided`);
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Token decoded:`, decoded);
    next();
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Token verification error:`, error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Middleware to verify user or admin role
const verifyUser = (req, res, next) => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'User access required' });
  }
  next();
};

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, '../Uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error creating Uploads directory:`, err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] File upload attempt:`, {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PNG, JPG, JPEG, and WEBP are allowed.`));
    }
  }
});

// Routes
router.get('/coins', getCoins); // Public
router.get('/coins/:id', getCoinById); // Public
router.get('/promoted', getPromotedCoins); // Public
router.get('/new-coins', getNewCoins); // Public
router.get('/presales', getPresaleCoins); // Public
router.get('/banners', getBanners); // Public
router.post('/submit-coin', verifyToken, verifyUser, upload.single('logo'), submitCoin);
router.get('/all-coins', verifyToken, verifyAdmin, getAllCoins);
router.get('/pending-coins', verifyToken, verifyAdmin, getPendingCoins);
router.post('/approve-coin/:id', verifyToken, verifyAdmin, approveCoin);
router.post('/reject-coin/:id', verifyToken, verifyAdmin, rejectCoin);
router.post('/promote-coin/:id', verifyToken, verifyAdmin, promoteCoin);
router.post('/unpromote-coin/:id', verifyToken, verifyAdmin, unpromoteCoin);
router.patch('/coins/:id', verifyToken, verifyAdmin, upload.single('logo'), editCoin);
router.delete('/coins/:id', verifyToken, verifyAdmin, deleteCoin);
router.post('/banners', verifyToken, verifyAdmin, upload.single('banner'), uploadBanner);
router.delete('/banners/:filename', verifyToken, verifyAdmin, deleteBanner);
router.post('/boost/:id', verifyToken, verifyUser, boostCoin);

module.exports = router;