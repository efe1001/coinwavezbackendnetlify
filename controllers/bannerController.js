const Entity = require('../models/Entity');

exports.uploadBanner = async (req, res) => {
  const { position } = req.body;
  const image = req.file ? req.file.path : '';
  try {
    const newBanner = new Entity.Banner({ image, position, filename: req.file ? req.file.filename : null });
    await newBanner.save();
    res.status(201).json({ message: 'Banner uploaded', banner: newBanner });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error uploading banner:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await Entity.Banner.find();
    res.json(banners);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching banners:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await Entity.Banner.findOneAndDelete({ id });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error deleting banner:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};