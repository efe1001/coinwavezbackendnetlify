const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_1234567890';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Token received:`, token);
  if (!token) {
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

const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.post('/register', authController.registerUser);
router.post('/admin-register', authController.registerAdmin);
router.post('/login', authController.loginUser);
router.post('/admin-login', authController.loginAdmin);
router.get('/users', verifyToken, verifyAdmin, authController.getUsers);
router.delete('/users/:id', verifyToken, verifyAdmin, authController.deleteUser);
router.post('/users/:userId/add-coins', verifyToken, verifyAdmin, authController.addCoinsToUser);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;