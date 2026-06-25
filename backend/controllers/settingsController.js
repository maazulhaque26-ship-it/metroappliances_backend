const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    const fields = ['storeName', 'storeTagline', 'storeAddress', 'copyrightText', 'phone', 'email', 'fullAddress', 'facebook', 'twitter', 'instagram', 'youtube'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { field } = req.body; // 'logo' or 'favicon'
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});

    const dbField = field === 'favicon' ? 'storeFavicon' : 'storeLogo';
    
    // Delete old file if it exists
    if (settings[dbField]) {
      const parts = settings[dbField].split('/');
      const filename = parts[parts.length - 1];
      const oldPath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    settings[dbField] = `/uploads/${req.file.filename}`;
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload media' });
  }
};
