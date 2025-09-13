const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Banners = low(new FileSync('models/banners.json'));
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

Banners.defaults({ banners: [] }).write();

exports.uploadBanner = async (req, res) => {
  const { position } = req.body;
  const image = req.file ? req.file.path : '';
  try {
    Banners.get('banners')
      .push({ id: Date.now().toString(), image, position, createdAt: new Date() })
      .write();
    res.status(201).json({ message: 'Banner uploaded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = Banners.get('banners').value();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = Banners.get('banners').remove({ id }).write();
    if (!banner.length) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};