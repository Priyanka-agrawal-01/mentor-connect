// MentorConnect - Profile Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus().then(user => {
        if (user) {
            initializeProfile(user);
        } else {
            window.location.href = 'login.html';
        }
    });

    // Initialize mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Edit profile modal
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const editProfileForm = document.getElementById('edit-profile-form');

    if (editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', () => {
            editProfileModal.classList.remove('hidden');
        });
    }

    if (closeEditModalBtn && editProfileModal) {
        closeEditModalBtn.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
        });
    }

    if (cancelEditBtn && editProfileModal) {
        cancelEditBtn.addEventListener('click', () => {
            editProfileModal.classList.add('hidden');
        });
    }

    // Mentorship request modal
    const requestMentorshipBtn = document.getElementById('request-mentorship-btn');
    const mentorshipRequestModal = document.getElementById('mentorship-request-modal');
    const closeMentorshipModalBtn = document.getElementById('close-mentorship-modal');
    const cancelMentorshipBtn = document.getElementById('cancel-mentorship');
    const mentorshipRequestForm = document.getElementById('mentorship-request-form');

    if (requestMentorshipBtn && mentorshipRequestModal) {
        requestMentorshipBtn.addEventListener('click', () => {
            mentorshipRequestModal.classList.remove('hidden');
        });
    }

    if (closeMentorshipModalBtn && mentorshipRequestModal) {
        closeMentorshipModalBtn.addEventListener('click', () => {
            mentorshipRequestModal.classList.add('hidden');
        });
    }

    if (cancelMentorshipBtn && mentorshipRequestModal) {
        cancelMentorshipBtn.addEventListener('click', () => {
            mentorshipRequestModal.classList.add('hidden');
        });
    }

    // Edit profile form submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateUserProfile();
        });
    }

    // Mentorship request form submission
    if (mentorshipRequestForm) {
        mentorshipRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMentorshipRequest();
        });
    }
});

// Global variables
let currentUser = null;
let profileUser = null;
let isOwnProfile = false;

// Initialize the profile page
async function initializeProfile(user) {
    currentUser = user;
    
    // Get user ID from URL parameter or use current user's ID
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || currentUser.id;
    
    // Check if viewing own profile
    isOwnProfile = userId === currentUser.id;
    
    try {
        // Fetch user data
        profileUser = await fetchUserData(userId);
        
        // Render profile data
        renderProfileData(profileUser);
        
        // Setup UI based on profile ownership
        setupProfileUI(isOwnProfile);
        
        // If not own profile, calculate and show match score
        if (!isOwnProfile) {
            const matchScore = await calculateMatchScore(userId);
            renderMatchScore(matchScore);
        }
        
    } catch (error) {
        console.error('Error initializing profile:', error);
        showToast('Error loading profile. Please try again.', 'error');
    }
}

// Fetch user data from server
async function fetchUserData(userId) {
    try {
        const response = await axios.get(`/api/users/${userId}`);
        return response.data.user;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Calculate match score between current user and profile user
async function calculateMatchScore(userId) {
    try {
        const response = await axios.get(`/api/users/${currentUser.id}/match/${userId}`);
        return response.data.matchScore;
    } catch (error) {
        console.error('Error calculating match score:', error);
        return null;
    }
}

// Render user profile data
function renderProfileData(user) {
    // Set profile image
    const profileImage = document.getElementById('profile-image');
    if (profileImage && user.profileImage) {
        profileImage.src = user.profileImage;
    }
    
    // Basic information
    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
    
    if (user.title) {
        document.getElementById('user-title').textContent = user.title;
    }
    
    if (user.batch) {
        document.getElementById('user-batch').textContent = `Batch: ${user.batch}`;
    }
    
    if (user.branch) {
        document.getElementById('user-branch').textContent = `Branch: ${user.branch}`;
    }
    
    // Bio
    if (user.bio) {
        document.getElementById('user-bio').textContent = user.bio;
    } else {
        document.getElementById('user-bio').textContent = 'No bio available.';
    }
    
    // Skills
    const skillsContainer = document.getElementById('user-skills');
    if (skillsContainer) {
        if (user.skills && user.skills.length > 0) {
            skillsContainer.innerHTML = '';
            user.skills.forEach(skill => {
                const skillBadge = document.createElement('span');
                skillBadge.className = 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm';
                skillBadge.textContent = skill;
                skillsContainer.appendChild(skillBadge);
            });
        } else {
            skillsContainer.innerHTML = '<p class="text-gray-500">No skills listed.</p>';
        }
    }
    
    // Interests
    const interestsContainer = document.getElementById('user-interests');
    if (interestsContainer) {
        if (user.interests && user.interests.length > 0) {
            interestsContainer.innerHTML = '';
            user.interests.forEach(interest => {
                const interestBadge = document.createElement('span');
                interestBadge.className = 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm';
                interestBadge.textContent = interest;
                interestsContainer.appendChild(interestBadge);
            });
        } else {
            interestsContainer.innerHTML = '<p class="text-gray-500">No interests listed.</p>';
        }
    }
    
    // Career Goals
    const goalsContainer = document.getElementById('user-goals');
    if (goalsContainer) {
        if (user.careerGoals && user.careerGoals.length > 0) {
            goalsContainer.innerHTML = '';
            user.careerGoals.forEach(goal => {
                const goalBadge = document.createElement('span');
                goalBadge.className = 'bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm';
                goalBadge.textContent = goal;
                goalsContainer.appendChild(goalBadge);
            });
        } else {
            goalsContainer.innerHTML = '<p class="text-gray-500">No career goals listed.</p>';
        }
    }
    
    // Contact information
    document.getElementById('user-email').textContent = user.email;
    
    // Social links
    if (user.linkedin) {
        document.getElementById('user-linkedin-container').classList.remove('hidden');
        const linkedinLink = document.getElementById('user-linkedin');
        linkedinLink.href = user.linkedin;
        linkedinLink.textContent = user.linkedin.replace('https://linkedin.com/in/', '');
    }
    
    if (user.github) {
        document.getElementById('user-github-container').classList.remove('hidden');
        const githubLink = document.getElementById('user-github');
        githubLink.href = user.github;
        githubLink.textContent = user.github.replace('https://github.com/', '');
    }
    
    // Badges
    const badgesContainer = document.getElementById('user-badges');
    if (badgesContainer) {
        if (user.badges && user.badges.length > 0) {
            badgesContainer.innerHTML = '';
            user.badges.forEach(badge => {
                const badgeElement = document.createElement('div');
                badgeElement.className = 'flex flex-col items-center justify-center bg-gray-100 p-2 rounded';
                badgeElement.innerHTML = `
                    <div class="w-12 h-12 flex items-center justify-center rounded-full ${badge.color} mb-1">
                        <i class="${badge.icon} text-white"></i>
                    </div>
                    <span class="text-xs text-center">${badge.name}</span>
                `;
                badgesContainer.appendChild(badgeElement);
            });
        } else {
            badgesContainer.innerHTML = '<p class="text-gray-500">No badges earned yet.</p>';
        }
    }
    
    // Communities
    const communitiesContainer = document.getElementById('user-communities');
    if (communitiesContainer) {
        if (user.communities && user.communities.length > 0) {
            communitiesContainer.innerHTML = '';
            user.communities.forEach(community => {
                const communityElement = document.createElement('li');
                communityElement.innerHTML = `
                    <a href="community-detail.html?id=${community._id}" class="flex items-center p-2 hover:bg-indigo-50 rounded transition">
                        <span class="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                        <span>${community.name}</span>
                    </a>
                `;
                communitiesContainer.appendChild(communityElement);
            });
        } else {
            communitiesContainer.innerHTML = '<li class="text-gray-500">Not a member of any communities.</li>';
        }
    }
    
    // Populate edit form if this is the user's own profile
    if (isOwnProfile) {
        populateEditForm(user);
    }
}

// Set up the profile UI based on whether it's the user's own profile
function setupProfileUI(isOwnProfile) {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const messageUserBtn = document.getElementById('message-user-btn');
    const requestMentorshipBtn = document.getElementById('request-mentorship-btn');
    const onlineStatus = document.getElementById('online-status');
    
    if (isOwnProfile) {
        // Show edit button
        if (editProfileBtn) {
            editProfileBtn.classList.remove('hidden');
        }
    } else {
        // Show message and mentorship buttons
        if (messageUserBtn) {
            messageUserBtn.classList.remove('hidden');
            
            // Add event listener for message button
            messageUserBtn.addEventListener('click', () => {
                window.location.href = `chat.html?userId=${profileUser._id}`;
            });
        }
        
        // Only show mentorship request button if user is available as mentor
        if (requestMentorshipBtn && profileUser.availableForMentorship) {
            requestMentorshipBtn.classList.remove('hidden');
        }
        
        // Show online status if user is online
        if (onlineStatus && profileUser.isOnline) {
            onlineStatus.classList.remove('hidden');
        }
    }
}

// Render the match score
function renderMatchScore(score) {
    if (score !== null) {
        const matchScoreContainer = document.getElementById('match-score');
        const matchPercentage = document.getElementById('match-percentage');
        
        if (matchScoreContainer && matchPercentage) {
            matchScoreContainer.classList.remove('hidden');
            matchPercentage.textContent = `${Math.round(score * 100)}%`;
        }
    }
}

// Populate the edit profile form
function populateEditForm(user) {
    // Personal information
    document.getElementById('edit-firstName').value = user.firstName || '';
    document.getElementById('edit-lastName').value = user.lastName || '';
    document.getElementById('edit-title').value = user.title || '';
    document.getElementById('edit-batch').value = user.batch || '';
    document.getElementById('edit-branch').value = user.branch || '';
    document.getElementById('edit-bio').value = user.bio || '';
    
    // Skills and interests
    document.getElementById('edit-skills').value = user.skills ? user.skills.join(', ') : '';
    document.getElementById('edit-interests').value = user.interests ? user.interests.join(', ') : '';
    document.getElementById('edit-careerGoals').value = user.careerGoals ? user.careerGoals.join(', ') : '';
    
    // Social links
    document.getElementById('edit-linkedin').value = user.linkedin || '';
    document.getElementById('edit-github').value = user.github || '';
    
    // Mentorship availability
    document.getElementById('edit-availableForMentorship').checked = user.availableForMentorship || false;
}

// Update user profile
async function updateUserProfile() {
    const updatedProfile = {
        firstName: document.getElementById('edit-firstName').value,
        lastName: document.getElementById('edit-lastName').value,
        title: document.getElementById('edit-title').value,
        batch: document.getElementById('edit-batch').value,
        branch: document.getElementById('edit-branch').value,
        bio: document.getElementById('edit-bio').value,
        skills: document.getElementById('edit-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        interests: document.getElementById('edit-interests').value.split(',').map(s => s.trim()).filter(Boolean),
        careerGoals: document.getElementById('edit-careerGoals').value.split(',').map(s => s.trim()).filter(Boolean),
        linkedin: document.getElementById('edit-linkedin').value,
        github: document.getElementById('edit-github').value,
        availableForMentorship: document.getElementById('edit-availableForMentorship').checked
    };
    
    try {
        await axios.put(`/api/users/${currentUser.id}`, updatedProfile);
        
        // Close modal
        document.getElementById('edit-profile-modal').classList.add('hidden');
        
        // Reload user data
        profileUser = await fetchUserData(currentUser.id);
        renderProfileData(profileUser);
        
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Error updating profile. Please try again.', 'error');
    }
}

// Send mentorship request
async function sendMentorshipRequest() {
    const mentorshipRequest = {
        mentorId: profileUser._id,
        message: document.getElementById('mentorship-message').value,
        goals: document.getElementById('mentorship-goals').value,
        duration: document.getElementById('mentorship-duration').value
    };
    
    try {
        await axios.post('/api/mentorship/requests', mentorshipRequest);
        
        // Close modal
        document.getElementById('mentorship-request-modal').classList.add('hidden');
        
        // Reset form
        document.getElementById('mentorship-request-form').reset();
        
        showToast('Mentorship request sent successfully!', 'success');
    } catch (error) {
        console.error('Error sending mentorship request:', error);
        showToast('Error sending mentorship request. Please try again.', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastMessage || !toastIcon) return;
    
    // Set message
    toastMessage.textContent = message;
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.innerHTML = '<i class="fas fa-check-circle text-xl"></i>';
        toastIcon.className = 'text-green-500 mr-3';
    } else {
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-xl"></i>';
        toastIcon.className = 'text-red-500 mr-3';
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
