const express = require('express');
const { uploadBanner, getBanners, deleteBanner } = require('../controllers/bannerController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post('/upload', auth, admin, upload.single('image'), uploadBanner);
router.get('/all', getBanners);
router.delete('/delete/:id', auth, admin, deleteBanner);

module.exports = router;