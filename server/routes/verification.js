const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User');
const aiVerification = require('../services/aiVerification');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const uploadDir = path.join(__dirname, '../uploads', userId);
    
    // Create user directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const documentType = req.params.documentType;
    const fileExt = path.extname(file.originalname);
    
    // Format: {documentType}_{timestamp}{extension}
    cb(null, `${documentType}_${Date.now()}${fileExt}`);
  }
});

// File filter to only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max size
  },
  fileFilter: fileFilter
});

/**
 * @route   GET /api/verification/status
 * @desc    Get verification status of the user
 * @access  Private
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({
      verificationProgress: user.verificationProgress,
      accountStatus: user.accountStatus,
      documents: {
        idCard: user.documents?.idCard || { verified: false },
        marksheet: user.documents?.marksheet || { verified: false }
      }
    });
  } catch (err) {
    console.error('Error getting verification status:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   POST /api/verification/upload/:documentType
 * @desc    Upload and verify document (ID Card or Marksheet)
 * @access  Private
 */
router.post('/upload/:documentType', auth, upload.single('document'), async (req, res) => {
  try {
    const { documentType } = req.params;
    const userId = req.user.id;
    
    // Validate document type
    if (!['idCard', 'marksheet'].includes(documentType)) {
      return res.status(400).json({ msg: 'Invalid document type' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    // Get file path
    const filePath = req.file.path;
    
    // Process verification based on document type
    let verificationResult;
    if (documentType === 'idCard') {
      verificationResult = await aiVerification.verifyIDCard(userId, filePath);
    } else {
      verificationResult = await aiVerification.verifyMarksheet(userId, filePath);
    }
    
    // Update document URL in database
    const documentUrl = `/uploads/${userId}/${req.file.filename}`;
    await User.findByIdAndUpdate(userId, {
      $set: { [`documents.${documentType}.url`]: documentUrl }
    });
    
    // Get updated user
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      verificationResult,
      verificationProgress: updatedUser.verificationProgress,
      accountStatus: updatedUser.accountStatus
    });
  } catch (err) {
    console.error('Error uploading and verifying document:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   GET /api/verification/admin/pending
 * @desc    Get list of users with pending verification (for admin)
 * @access  Private/Admin
 */
router.get('/admin/pending', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.userType !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized access' });
    }
    
    // Get users with pending verification
    const pendingUsers = await User.find({
      accountStatus: 'pending',
      verificationProgress: { $gt: 0, $lt: 100 }
    }).select('-password');
    
    res.json(pendingUsers);
  } catch (err) {
    console.error('Error getting pending verifications:', err);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT /api/verification/admin/manual/:userId/:documentType
 * @desc    Manually update verification status (for admin)
 * @access  Private/Admin
 */
router.put('/admin/manual/:userId/:documentType', auth, async (req, res) => {
  try {
    // Check if user is admin
    const adminUser = await User.findById(req.user.id);
    if (adminUser.userType !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized access' });
    }
    
    const { userId, documentType } = req.params;
    const { verified, rejectionReason } = req.body;
    
    if (!['idCard', 'marksheet'].includes(documentType)) {
      return res.status(400).json({ msg: 'Invalid document type' });
    }
    
    // Update document verification status
    const updateData = {
      [`documents.${documentType}.verified`]: verified,
      [`documents.${documentType}.verificationDate`]: new Date()
    };
    
    if (!verified && rejectionReason) {
      updateData[`documents.${documentType}.rejectionReason`] = rejectionReason;
    }
    
    await User.findByIdAndUpdate(userId, { $set: updateData });
    
    // Update verification progress
    await aiVerification._updateVerificationProgress(userId);
    
    // Get updated user
    const updatedUser = await User.findById(userId).select('-password');
    
    res.json({
      msg: `Document ${verified ? 'verified' : 'rejected'} successfully`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating verification status:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
