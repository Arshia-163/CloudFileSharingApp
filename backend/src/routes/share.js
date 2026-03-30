const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const File = require('../models/File');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create share link
router.post('/:id', authMiddleware, async (req, res) => {
  try {
    const { expiresIn, password } = req.body; // expiresIn in hours
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.shareToken = uuidv4();
    file.shareExpiry = expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : null;
    file.sharePassword = password ? await bcrypt.hash(password, 10) : null;

    await file.save();
    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${file.shareToken}`;
    res.json({ shareToken: file.shareToken, shareUrl, expiresAt: file.shareExpiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Revoke share
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.shareToken = null;
    file.shareExpiry = null;
    file.sharePassword = null;
    await file.save();

    res.json({ message: 'Share link revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Access shared file (public)
router.get('/access/:token', async (req, res) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token }).populate('owner', 'name');
    if (!file) return res.status(404).json({ message: 'Shared file not found or link revoked' });

    if (file.shareExpiry && new Date() > file.shareExpiry)
      return res.status(410).json({ message: 'Share link has expired' });

    const needsPassword = !!file.sharePassword;
    res.json({
      file: {
        _id: file._id,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt,
        downloadCount: file.downloadCount,
        owner: file.owner?.name
      },
      needsPassword
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download shared file (public)
router.post('/download/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const file = await File.findOne({ shareToken: req.params.token });
    if (!file) return res.status(404).json({ message: 'Shared file not found' });

    if (file.shareExpiry && new Date() > file.shareExpiry)
      return res.status(410).json({ message: 'Share link has expired' });

    if (file.sharePassword) {
      if (!password) return res.status(401).json({ message: 'Password required' });
      const isMatch = await bcrypt.compare(password, file.sharePassword);
      if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
    }

    file.downloadCount += 1;
    await file.save();

    res.download(file.path, file.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
