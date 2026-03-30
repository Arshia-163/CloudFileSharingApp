const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  folder: { type: String, default: '/' },
  isStarred: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
  shareToken: { type: String, default: null, index: true },
  shareExpiry: { type: Date, default: null },
  sharePassword: { type: String, default: null },
  downloadCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fileSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

fileSchema.virtual('isExpired').get(function () {
  if (!this.shareExpiry) return false;
  return new Date() > this.shareExpiry;
});

fileSchema.methods.getCategory = function () {
  const mime = this.mimetype;
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('word') || mime.includes('document')) return 'document';
  if (mime.includes('sheet') || mime.includes('excel')) return 'spreadsheet';
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return 'archive';
  if (mime.startsWith('text/')) return 'text';
  return 'other';
};

module.exports = mongoose.model('File', fileSchema);
