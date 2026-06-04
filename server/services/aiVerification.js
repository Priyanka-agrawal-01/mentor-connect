const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

// Configuration for the AI verification service
const AI_API_KEY = process.env.AI_VERIFICATION_API_KEY || 'demo_key';
const AI_ENDPOINT = process.env.AI_VERIFICATION_ENDPOINT || 'https://api.verification.ai/v1/verify';

/**
 * AI Document Verification Service
 * Uses computer vision and OCR to verify academic documents and ID cards
 */
class AIVerificationService {
  /**
   * Verify an ID card document
   * @param {String} userId - The user ID
   * @param {String} documentPath - Path to the uploaded document
   * @returns {Promise<Object>} Verification result
   */
  async verifyIDCard(userId, documentPath) {
    try {
      // 1. Get user details for cross-verification
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 2. Prepare document for AI analysis
      const documentBuffer = fs.readFileSync(documentPath);
      const documentBase64 = documentBuffer.toString('base64');

      // 3. Call AI verification API
      const verificationResult = await this._callAIVerificationAPI('id_card', {
        document: documentBase64,
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          // We can add other fields for cross-verification
        }
      });

      // 4. Update user document status
      await this._updateDocumentStatus(userId, 'idCard', verificationResult);

      return verificationResult;
    } catch (error) {
      console.error('ID Card verification error:', error);
      return {
        verified: false,
        confidence: 0,
        errors: [error.message],
        details: null
      };
    }
  }

  /**
   * Verify a marksheet/transcript document
   * @param {String} userId - The user ID
   * @param {String} documentPath - Path to the uploaded document
   * @returns {Promise<Object>} Verification result
   */
  async verifyMarksheet(userId, documentPath) {
    try {
      // 1. Get user details for cross-verification
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 2. Prepare document for AI analysis
      const documentBuffer = fs.readFileSync(documentPath);
      const documentBase64 = documentBuffer.toString('base64');

      // 3. Call AI verification API
      const verificationResult = await this._callAIVerificationAPI('marksheet', {
        document: documentBase64,
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          batch: user.batch,
          branch: user.branch
        }
      });

      // 4. Update user document status
      await this._updateDocumentStatus(userId, 'marksheet', verificationResult);

      return verificationResult;
    } catch (error) {
      console.error('Marksheet verification error:', error);
      return {
        verified: false,
        confidence: 0,
        errors: [error.message],
        details: null
      };
    }
  }

  /**
   * Call the AI verification API
   * @param {String} documentType - Type of document (id_card or marksheet)
   * @param {Object} data - The data to send to the API
   * @returns {Promise<Object>} API response
   * @private
   */
  async _callAIVerificationAPI(documentType, data) {
    try {
      // In a real implementation, this would call an actual AI verification API
      // For this demo, we simulate the AI verification process
      
      if (process.env.NODE_ENV === 'production') {
        // In production, make actual API call
        const response = await axios.post(AI_ENDPOINT, {
          api_key: AI_API_KEY,
          document_type: documentType,
          ...data
        });
        return response.data;
      } else {
        // In development/testing, simulate verification with high probability of success
        // But occasional verification failures
        return this._simulateAIVerification(documentType, data);
      }
    } catch (error) {
      console.error('AI API call error:', error);
      throw error;
    }
  }

  /**
   * Simulate AI verification for development/testing
   * @param {String} documentType - Type of document
   * @param {Object} data - The verification data
   * @returns {Object} Simulated verification result
   * @private
   */
  _simulateAIVerification(documentType, data) {
    // Simulate verification with 85% chance of success
    const isVerified = Math.random() < 0.85;
    const confidence = isVerified ? 0.7 + (Math.random() * 0.29) : Math.random() * 0.6;
    
    // Create detailed response similar to what an actual AI service might return
    if (isVerified) {
      if (documentType === 'id_card') {
        return {
          verified: true,
          confidence: confidence,
          errors: [],
          details: {
            name_match: true,
            expiration_valid: true,
            tampering_detected: false,
            extracted_data: {
              name: `${data.userData.firstName} ${data.userData.lastName}`,
              id_number: `ID${Math.floor(Math.random() * 1000000)}`,
              issue_date: "2022-01-01",
              expiry_date: "2026-01-01"
            }
          }
        };
      } else {
        return {
          verified: true,
          confidence: confidence,
          errors: [],
          details: {
            document_type: "Academic Transcript",
            institution_verified: true,
            grades_extracted: true,
            batch_match: true,
            branch_match: true,
            extracted_data: {
              institution: "University of Technology",
              student_name: `${data.userData.firstName} ${data.userData.lastName}`,
              batch: data.userData.batch,
              branch: data.userData.branch,
              gpa: (3 + Math.random()).toFixed(2)
            }
          }
        };
      }
    } else {
      // Generate a plausible verification failure
      const errorReasons = [
        "Document image quality too low",
        "Text not clearly visible",
        "Document appears to be modified",
        "Unable to match user details with document",
        "Document format not recognized"
      ];
      const randomError = errorReasons[Math.floor(Math.random() * errorReasons.length)];
      
      return {
        verified: false,
        confidence: confidence,
        errors: [randomError],
        details: null
      };
    }
  }

  /**
   * Update user document verification status in database
   * @param {String} userId - User ID
   * @param {String} documentType - Type of document (idCard or marksheet)
   * @param {Object} result - Verification result
   * @returns {Promise<void>}
   * @private
   */
  async _updateDocumentStatus(userId, documentType, result) {
    try {
      const updateData = {
        [`documents.${documentType}.verified`]: result.verified,
        [`documents.${documentType}.verificationDate`]: new Date()
      };
      
      if (!result.verified && result.errors && result.errors.length > 0) {
        updateData[`documents.${documentType}.rejectionReason`] = result.errors.join(', ');
      }
      
      await User.findByIdAndUpdate(userId, { $set: updateData });
      
      // Calculate overall verification progress and update account status
      await this._updateVerificationProgress(userId);
      
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  /**
   * Update user's overall verification progress and account status
   * @param {String} userId - User ID
   * @returns {Promise<void>}
   * @private
   */
  async _updateVerificationProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;
      
      // Calculate verification progress (0-100%)
      let progress = 0;
      let verifiedCount = 0;
      const requiredDocuments = ['idCard', 'marksheet'];
      
      requiredDocuments.forEach(docType => {
        if (user.documents && user.documents[docType] && user.documents[docType].verified) {
          verifiedCount++;
        }
      });
      
      progress = Math.round((verifiedCount / requiredDocuments.length) * 100);
      
      // Update account status based on progress
      let accountStatus = 'pending';
      if (progress === 100) {
        accountStatus = 'verified';
      } else if (progress > 0) {
        accountStatus = 'pending';
      }
      
      // Update user
      await User.findByIdAndUpdate(userId, {
        $set: {
          verificationProgress: progress,
          accountStatus: accountStatus
        }
      });
      
    } catch (error) {
      console.error('Error updating verification progress:', error);
      throw error;
    }
  }
}

module.exports = new AIVerificationService();
