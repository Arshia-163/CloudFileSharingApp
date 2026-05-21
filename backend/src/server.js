const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const shareRoutes = require('./routes/share');

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// ROOT ROUTE (NEW)
// ==========================
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'CloudShare Backend API Running 🚀'
  });
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
});

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

module.exports = app;