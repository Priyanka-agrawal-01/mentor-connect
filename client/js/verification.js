
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const progressBar = document.getElementById('progress-bar');
    const verificationStatus = document.getElementById('verification-status');
    
    const idCardSection = document.getElementById('id-card-section');
    const idCardStatus = document.getElementById('id-card-status');
    const idCardUploadForm = document.getElementById('id-card-upload-form');
    const idCardFile = document.getElementById('id-card-file');
    const idCardFilename = document.getElementById('id-card-filename');
    const idCardFileDetails = document.getElementById('id-card-file-details');
    const idCardRemoveBtn = document.getElementById('id-card-remove-btn');
    const idCardUploadBtn = document.getElementById('id-card-upload-btn');
    const idCardVerified = document.getElementById('id-card-verified');
    const idCardVerifiedDate = document.getElementById('id-card-verified-date');
    const idCardRejected = document.getElementById('id-card-rejected');
    const idCardRejectionReason = document.getElementById('id-card-rejection-reason');
    const retryIdCardBtn = document.getElementById('retry-id-card-btn');
    const idCardProcessing = document.getElementById('id-card-processing');
    
    // Marksheet elements
    const marksheetSection = document.getElementById('marksheet-section');
    const marksheetStatus = document.getElementById('marksheet-status');
    const marksheetUploadForm = document.getElementById('marksheet-upload-form');
    const marksheetFile = document.getElementById('marksheet-file');
    const marksheetFilename = document.getElementById('marksheet-filename');
    const marksheetFileDetails = document.getElementById('marksheet-file-details');
    const marksheetRemoveBtn = document.getElementById('marksheet-remove-btn');
    const marksheetUploadBtn = document.getElementById('marksheet-upload-btn');
    const marksheetVerified = document.getElementById('marksheet-verified');
    const marksheetVerifiedDate = document.getElementById('marksheet-verified-date');
    const marksheetRejected = document.getElementById('marksheet-rejected');
    const marksheetRejectionReason = document.getElementById('marksheet-rejection-reason');
    const retryMarksheetBtn = document.getElementById('retry-marksheet-btn');
    const marksheetProcessing = document.getElementById('marksheet-processing');
    
    const allVerifiedSection = document.getElementById('all-verified-section');
    
    // Toast notification
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // API base URL
    const API_BASE_URL = 'http://localhost:5000/api';

    // Initialize verification status
    fetchVerificationStatus();

    // File selection handlers
    idCardFile.addEventListener('change', (e) => handleFileSelection(e, 'id-card'));
    marksheetFile.addEventListener('change', (e) => handleFileSelection(e, 'marksheet'));

    // Remove file handlers
    idCardRemoveBtn.addEventListener('click', () => removeSelectedFile('id-card'));
    marksheetRemoveBtn.addEventListener('click', () => removeSelectedFile('marksheet'));

    // Upload button handlers
    idCardUploadBtn.addEventListener('click', () => uploadDocument('idCard'));
    marksheetUploadBtn.addEventListener('click', () => uploadDocument('marksheet'));

    // Retry button handlers
    retryIdCardBtn.addEventListener('click', () => {
        hideElement(idCardRejected);
        showElement(idCardUploadForm);
    });

    retryMarksheetBtn.addEventListener('click', () => {
        hideElement(marksheetRejected);
        showElement(marksheetUploadForm);
    });

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    /**
     * Fetch user's verification status
     */
    async function fetchVerificationStatus() {
        try {
            const response = await axios.get(`${API_BASE_URL}/verification/status`, {
                headers: {
                    'x-auth-token': token
                }
            });

            const { verificationProgress, accountStatus, documents } = response.data;
            
            // Update progress bar
            updateProgressBar(verificationProgress);
            
            // Update account status
            updateAccountStatus(accountStatus);
            
            // Update document statuses
            updateDocumentStatus('idCard', documents.idCard);
            updateDocumentStatus('marksheet', documents.marksheet);
            
            // Check if all documents are verified
            if (accountStatus === 'verified') {
                showElement(allVerifiedSection);
            }
            
        } catch (error) {
            console.error('Error fetching verification status:', error);
            showToast('Error loading verification status', 'error');
        }
    }

    /**
     * Handle file selection for document upload
     */
    function handleFileSelection(event, prefix) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file type. Please upload JPG, PNG, or PDF', 'error');
            removeSelectedFile(prefix);
            return;
        }
        
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File is too large. Maximum size is 5MB', 'error');
            removeSelectedFile(prefix);
            return;
        }
        
        // Display file details
        const filenameElement = document.getElementById(`${prefix}-filename`);
        filenameElement.textContent = file.name;
        
        showElement(document.getElementById(`${prefix}-file-details`));
    }

    /**
     * Remove selected file
     */
    function removeSelectedFile(prefix) {
        const fileInput = document.getElementById(`${prefix}-file`);
        fileInput.value = '';
        hideElement(document.getElementById(`${prefix}-file-details`));
    }

    /**
     * Upload document to server
     */
    async function uploadDocument(documentType) {
        // Get file
        const fileInput = document.getElementById(`${documentType === 'idCard' ? 'id-card' : 'marksheet'}-file`);
        const file = fileInput.files[0];
        
        if (!file) {
            showToast('Please select a file to upload', 'error');
            return;
        }
        
        // Show processing state
        const processingElement = document.getElementById(`${documentType === 'idCard' ? 'id-card' : 'marksheet'}-processing`);
        const uploadFormElement = document.getElementById(`${documentType === 'idCard' ? 'id-card' : 'marksheet'}-upload-form`);
        
        hideElement(uploadFormElement);
        showElement(processingElement);
        
        try {
            // Create form data
            const formData = new FormData();
            formData.append('document', file);
            
            // Upload file
            const response = await axios.post(
                `${API_BASE_URL}/verification/upload/${documentType}`, 
                formData, 
                {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            // Hide processing state
            hideElement(processingElement);
            
            const { verificationResult, verificationProgress, accountStatus } = response.data;
            
            // Update UI based on verification result
            if (verificationResult.verified) {
                showVerificationSuccess(documentType);
                showToast('Document verified successfully!', 'success');
            } else {
                showVerificationFailure(documentType, verificationResult.errors.join(', '));
                showToast('Document verification failed', 'error');
            }
            
            // Update overall progress
            updateProgressBar(verificationProgress);
            updateAccountStatus(accountStatus);
            
            // Check if all documents are verified
            if (accountStatus === 'verified') {
                showElement(allVerifiedSection);
            }
            
        } catch (error) {
            console.error(`Error uploading ${documentType}:`, error);
            
            // Hide processing state
            hideElement(processingElement);
            showElement(uploadFormElement);
            
            showToast('Error uploading document. Please try again.', 'error');
        }
    }

    /**
     * Show verification success UI
     */
    function showVerificationSuccess(documentType) {
        const prefix = documentType === 'idCard' ? 'id-card' : 'marksheet';
        const statusElement = document.getElementById(`${prefix}-status`);
        const verifiedElement = document.getElementById(`${prefix}-verified`);
        const verifiedDateElement = document.getElementById(`${prefix}-verified-date`);
        
        // Update status badge
        statusElement.className = 'py-1 px-3 rounded-full bg-green-100 text-green-800 text-sm';
        statusElement.textContent = 'Verified';
        
        // Show verified section
        showElement(verifiedElement);
        
        // Set verification date
        const today = new Date();
        verifiedDateElement.textContent = `Verified on ${today.toLocaleDateString()}`;
    }

    /**
     * Show verification failure UI
     */
    function showVerificationFailure(documentType, reason) {
        const prefix = documentType === 'idCard' ? 'id-card' : 'marksheet';
        const statusElement = document.getElementById(`${prefix}-status`);
        const rejectedElement = document.getElementById(`${prefix}-rejected`);
        const rejectionReasonElement = document.getElementById(`${prefix}-rejection-reason`);
        
        // Update status badge
        statusElement.className = 'py-1 px-3 rounded-full bg-red-100 text-red-800 text-sm';
        statusElement.textContent = 'Rejected';
        
        // Show rejected section
        showElement(rejectedElement);
        
        // Set rejection reason
        rejectionReasonElement.textContent = reason || 'Document verification failed. Please try again with a clearer image.';
    }

    /**
     * Update document status in UI
     */
    function updateDocumentStatus(documentType, status) {
        const prefix = documentType === 'idCard' ? 'id-card' : 'marksheet';
        const statusElement = document.getElementById(`${prefix}-status`);
        const uploadFormElement = document.getElementById(`${prefix}-upload-form`);
        const verifiedElement = document.getElementById(`${prefix}-verified`);
        const rejectedElement = document.getElementById(`${prefix}-rejected`);
        
        // Hide all states first
        hideElement(uploadFormElement);
        hideElement(verifiedElement);
        hideElement(rejectedElement);
        
        if (status.verified) {
            // Document is verified
            statusElement.className = 'py-1 px-3 rounded-full bg-green-100 text-green-800 text-sm';
            statusElement.textContent = 'Verified';
            
            showElement(verifiedElement);
            
            // Set verification date
            const verificationDate = status.verificationDate ? new Date(status.verificationDate) : new Date();
            document.getElementById(`${prefix}-verified-date`).textContent = `Verified on ${verificationDate.toLocaleDateString()}`;
        } else if (status.rejectionReason) {
            // Document was rejected
            statusElement.className = 'py-1 px-3 rounded-full bg-red-100 text-red-800 text-sm';
            statusElement.textContent = 'Rejected';
            
            showElement(rejectedElement);
            document.getElementById(`${prefix}-rejection-reason`).textContent = status.rejectionReason;
        } else {
            // Document is pending or not yet uploaded
            statusElement.className = 'py-1 px-3 rounded-full bg-gray-100 text-gray-600 text-sm';
            statusElement.textContent = 'Pending';
            
            showElement(uploadFormElement);
        }
    }

    /**
     * Update progress bar
     */
    function updateProgressBar(progress) {
        progressBar.style.width = `${progress}%`;
    }

    /**
     * Update account status
     */
    function updateAccountStatus(status) {
        switch (status) {
            case 'verified':
                verificationStatus.className = 'text-center py-2 px-4 rounded-full bg-green-100 text-green-800 inline-block';
                verificationStatus.textContent = 'Verified';
                break;
            case 'rejected':
                verificationStatus.className = 'text-center py-2 px-4 rounded-full bg-red-100 text-red-800 inline-block';
                verificationStatus.textContent = 'Rejected';
                break;
            default:
                verificationStatus.className = 'text-center py-2 px-4 rounded-full bg-yellow-100 text-yellow-800 inline-block';
                verificationStatus.textContent = 'Pending Verification';
                break;
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        if (type === 'success') {
            toastIcon.className = 'text-green-500 mr-3';
            toastIcon.innerHTML = '<i class="fas fa-check-circle text-xl"></i>';
        } else {
            toastIcon.className = 'text-red-500 mr-3';
            toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-xl"></i>';
        }
        
        // Show toast
        toast.classList.remove('hidden', 'translate-y-full', 'opacity-0');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    /**
     * Show an element
     */
    function showElement(element) {
        if (element) {
            element.classList.remove('hidden');
        }
    }

    /**
     * Hide an element
     */
    function hideElement(element) {
        if (element) {
            element.classList.add('hidden');
        }
    }
});
