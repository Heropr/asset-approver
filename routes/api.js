const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload images and create a batch
router.post('/upload', upload.array('images', 20), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const batchId = uuidv4();
    db.createBatch(batchId);

    const assets = req.files.map(file => {
      const assetId = uuidv4();
      db.createAsset(assetId, batchId, file.originalname, file.filename);
      return {
        id: assetId,
        filename: file.originalname,
        filepath: file.filename
      };
    });

    res.json({
      batchId,
      assets,
      reviewUrl: `/review/${batchId}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get batch with all assets
router.get('/batches/:id', (req, res) => {
  try {
    const batch = db.getBatch(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const assets = db.getAssetsByBatch(req.params.id);
    res.json({ ...batch, assets });
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
});

// Get single asset with comments
router.get('/assets/:id', (req, res) => {
  try {
    const asset = db.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const comments = db.getCommentsByAsset(req.params.id);
    res.json({ ...asset, comments });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

// Update asset status (approve/reject)
router.post('/assets/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const asset = db.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    db.updateAssetStatus(req.params.id, status);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Add comment to asset
router.post('/assets/:id/comments', (req, res) => {
  try {
    const { author, content } = req.body;
    if (!author || !content) {
      return res.status(400).json({ error: 'Author and content are required' });
    }

    const asset = db.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const comment = db.createComment(req.params.id, author, content);
    res.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
