const express = require('express');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(authMiddleware);

// Upload files
router.post('/upload', upload.array('files', 20), async (req, res) => {
  try {
    const { folder = '/' } = req.body;
    const user = req.user;

    // Check storage limit
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
    if (user.storageUsed + totalSize > user.storageLimit)
      return res.status(400).json({ message: 'Storage limit exceeded' });

    const savedFiles = await Promise.all(req.files.map(async (f) => {
      const file = new File({
        owner: user._id,
        originalName: f.originalname,
        storedName: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        folder
      });
      return file.save();
    }));

    user.storageUsed += totalSize;
    await user.save();

    res.status(201).json({ files: savedFiles, message: `${savedFiles.length} file(s) uploaded` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List files
router.get('/', async (req, res) => {
  try {
    const { folder = '/', search, category, starred, trash, page = 1, limit = 50 } = req.query;

    const query = { owner: req.user._id };

    if (trash === 'true') {
      query.isTrashed = true;
    } else {
      query.isTrashed = false;
      if (folder && !search) query.folder = folder;
    }

    if (search) query.originalName = { $regex: search, $options: 'i' };
    if (starred === 'true') query.isStarred = true;

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await File.countDocuments(query);

    // Filter by category if needed
    const filtered = category
      ? files.filter(f => f.getCategory() === category)
      : files;

    res.json({ files: filtered, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get file info
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download file
router.get('/:id/download', async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.downloadCount += 1;
    await file.save();

    res.download(file.path, file.originalName);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update file (rename, star, move)
router.put('/:id', async (req, res) => {
  try {
    const { originalName, isStarred, folder, tags } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (originalName !== undefined) file.originalName = originalName;
    if (isStarred !== undefined) file.isStarred = isStarred;
    if (folder !== undefined) file.folder = folder;
    if (tags !== undefined) file.tags = tags;

    await file.save();
    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Trash file
router.patch('/:id/trash', async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.isTrashed = !file.isTrashed;
    file.trashedAt = file.isTrashed ? new Date() : null;
    await file.save();

    res.json({ file, message: file.isTrashed ? 'Moved to trash' : 'Restored from trash' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanently delete
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Remove from disk
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    // Update user storage
    req.user.storageUsed = Math.max(0, req.user.storageUsed - file.size);
    await req.user.save();

    await File.deleteOne({ _id: file._id });
    res.json({ message: 'File permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Storage stats
router.get('/stats/storage', async (req, res) => {
  try {
    const files = await File.find({ owner: req.user._id, isTrashed: false });
    const stats = { total: 0, image: 0, video: 0, audio: 0, document: 0, other: 0 };

    files.forEach(f => {
      const cat = f.getCategory();
      stats.total += f.size;
      stats[cat] = (stats[cat] || 0) + f.size;
    });

    res.json({
      stats,
      used: req.user.storageUsed,
      limit: req.user.storageLimit,
      fileCount: files.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
