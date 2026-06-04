

document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.src = 'js/shared-data.js';
    script.onload = function() {
        initializeDashboard();
    };
    document.head.appendChild(script);
});

function initializeDashboard() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
        window.location.href = 'login.html';
        return;
    }

    if (window.socketClient) {
        window.socketClient.connect(currentUser.id);
        
        window.socketClient.on('user-status-change', (data) => {
            updateActiveUsers(currentUser);
        });
        
        window.socketClient.on('connection-request', (data) => {
            checkConnectionRequests(currentUser);
        });
        
        window.socketClient.on('online-users-status', (data) => {
            updateUserStatuses(data);
        });
    } else {
        window.sharedData.setUserActive(currentUser);
        
        setInterval(function() {
            window.sharedData.setUserActive(currentUser);
        }, 60000); 
    }
    
    window.addEventListener('beforeunload', function() {
        if (window.socketClient && window.socketClient.connected) {
            window.socketClient.disconnect();
        } else {
            window.sharedData.setUserInactive(currentUser.id);
        }
    });

    initializeTabs();
    
    initializeUserData(currentUser);
    
    initializeProfileDropdown();
    
    initializeMobileMenu();
    
    loadPersonalizedContent(currentUser);
    
    setupActiveUsersDisplay(currentUser);
    
    checkConnectionRequests(currentUser);
    
    setInterval(function() {
        updateActiveUsers(currentUser);
        checkConnectionRequests(currentUser);
    }, 10000); 
    
    setupLogoutFunctionality();
    
    setupMessageButtons();
    
    initializeAiMatchFeature();
    
    // Initialize mentor exam button
    const mentorExamBtn = document.querySelector('a[href="mentor-exam.html"]');
    if (mentorExamBtn) {
        mentorExamBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check if user is already a mentor
            if (currentUser.isMentor) {
                showNotification('You are already a certified mentor!', 'info');
                return;
            }
            
            // Check if user has completed profile
            if (!currentUser.profileComplete) {
                showNotification('Please complete your profile before taking the mentor exam', 'warning');
                window.location.href = 'profile.html';
                return;
            }
            
            // Navigate to exam
            window.location.href = 'mentor-exam.html';
        });
    }

    // Initialize navigation tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
        });
    });

    // Initialize message buttons
    const messageButtons = document.querySelectorAll('.bg-blue-600.text-white.rounded-md.hover:bg-blue-700');
    messageButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mentorId = this.closest('[data-user-id]').dataset.userId;
            window.location.href = `chat.html?recipientId=${mentorId}`;
        });
    });
}

function initializeAiMatchFeature() {
    const aiMatchButton = document.getElementById('find-ai-match-btn');
    const aiMatchModal = document.getElementById('ai-match-modal');
    const aiMatchClose = document.getElementById('ai-match-close');
    const aiMatchSubmit = document.getElementById('ai-match-submit');
    const aiMatchReset = document.getElementById('ai-match-reset');
    const aiMatchForm = document.getElementById('ai-match-form');
    
    if (aiMatchButton) {
        aiMatchButton.addEventListener('click', function() {
            aiMatchModal.classList.remove('hidden');
            preloadUserPreferences();
        });
    }
    
    if (aiMatchClose) {
        aiMatchClose.addEventListener('click', function() {
            aiMatchModal.classList.add('hidden');
        });
    }
    
    aiMatchModal.addEventListener('click', function(e) {
        if (e.target === aiMatchModal || e.target.classList.contains('fixed')) {
            aiMatchModal.classList.add('hidden');
        }
    });
    
    if (aiMatchReset) {
        aiMatchReset.addEventListener('click', function() {
            aiMatchForm.reset();
            
            document.getElementById('ai-branches').selectedIndex = -1;
            document.getElementById('ai-interests').selectedIndex = -1;
            
            document.getElementById('match-precision').value = 2;
        });
    }
    
    if (aiMatchSubmit) {
        aiMatchSubmit.addEventListener('click', function() {
            const originalText = aiMatchSubmit.innerHTML;
            aiMatchSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
            aiMatchSubmit.disabled = true;
            
            const skillLevel = document.querySelector('input[name="skill-level"]:checked').value;
            const learningStyle = document.querySelector('input[name="learning-style"]:checked').value;
            
            const branches = Array.from(document.getElementById('ai-branches').selectedOptions).map(option => option.value);
            const interests = Array.from(document.getElementById('ai-interests').selectedOptions).map(option => option.value);
            
            const careerGoals = document.getElementById('career-goals').value;
            const matchPrecision = document.getElementById('match-precision').value;
            
            setTimeout(function() {
                const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
                
                generateAiMatches({
                    userId: currentUser.id,
                    skillLevel,
                    learningStyle,
                    branches,
                    interests,
                    careerGoals,
                    matchPrecision
                });
                
                aiMatchSubmit.innerHTML = originalText;
                aiMatchSubmit.disabled = false;
                
                aiMatchModal.classList.add('hidden');
                
                showNotification('Perfect matches generated with AI! Displaying your custom recommendations.', 'success');
                
                document.getElementById('mentors-tab').click();
                
                document.getElementById('mentors-content').scrollIntoView({ behavior: 'smooth' });
                
                document.querySelector('#mentors-content h2').textContent = 'AI-Matched Mentors Just for You';
                document.querySelector('#mentors-content p').textContent = 'These mentors have been custom-matched to your preferences';
            }, 2000); 
        });
    }
}

function preloadUserPreferences() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.branches && currentUser.branches.length > 0) {
        const branchSelect = document.getElementById('ai-branches');
        
        Array.from(branchSelect.options).forEach(option => {
            if (currentUser.branches.includes(option.value)) {
                option.selected = true;
            }
        });
    }
    
    if (currentUser.interests && currentUser.interests.length > 0) {
        const interestsSelect = document.getElementById('ai-interests');
        
        Array.from(interestsSelect.options).forEach(option => {
            const interestMap = {
                'Web Development': 'web',
                'Mobile Apps': 'mobile',
                'Machine Learning': 'ml',
                'Cloud Computing': 'cloud',
                'Data Science': 'data',
                'UI/UX Design': 'design'
            };
            
            for (const interest of currentUser.interests) {
                if (interestMap[interest] === option.value) {
                    option.selected = true;
                    break;
                }
            }
        });
    }
}

function generateAiMatches(preferences) {
    console.log('Generating AI matches with preferences:', preferences);
    
    const mentorCards = document.querySelectorAll('.bg-white.rounded-xl[data-user-id]');
    const mentorContainer = document.querySelector('#mentors-content .grid');
    
    if (mentorContainer) {
        mentorContainer.innerHTML = '';
        const shuffledMentors = Array.from(mentorCards);
        for (let i = shuffledMentors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledMentors[i], shuffledMentors[j]] = [shuffledMentors[j], shuffledMentors[i]];
        }
        
        shuffledMentors.forEach(mentor => {
            const mentorClone = mentor.cloneNode(true);
            
            const skills = Array.from(mentorClone.querySelectorAll('.bg-blue-100')).map(skill => skill.textContent.trim());
            
            let matchPercentage = Math.floor(Math.random() * 20) + 80; 
            
            if (preferences.branches && preferences.branches.length > 0) {
                skills.forEach(skill => {
                    if (preferences.branches.includes(skill)) {
                        matchPercentage = Math.min(99, matchPercentage + 3);
                    }
                });
            }
            
            if (preferences.interests && preferences.interests.length > 0) {
                const interestMap = {
                    'web': 'Full Stack',
                    'mobile': 'Mobile',
                    'ml': 'Machine Learning',
                    'cloud': 'Cloud',
                    'data': 'Data Science',
                    'design': 'UI/UX'
                };
                
                preferences.interests.forEach(interest => {
                    if (skills.some(skill => skill.includes(interestMap[interest]))) {
                        matchPercentage = Math.min(99, matchPercentage + 5);
                    }
                });
            }
            
            const matchElem = mentorClone.querySelector('.text-green-600');
            if (matchElem) {
                matchElem.textContent = matchPercentage + '% Match';
            }
            
            const nameContainer = mentorClone.querySelector('h3').parentNode;
            const aiBadge = document.createElement('div');
            aiBadge.className = 'flex items-center mt-1 text-xs text-blue-600';
            aiBadge.innerHTML = '<i class="fas fa-robot mr-1"></i> AI Matched';
            nameContainer.appendChild(aiBadge);
            
            mentorContainer.appendChild(mentorClone);
        });
        
        setupMessageButtons();
    }
}

function setupMessageButtons() {
    const messageButtons = document.querySelectorAll('.bg-white.rounded-xl button.border.border-blue-600');
    
    messageButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const mentorCard = this.closest('.bg-white.rounded-xl');
            const mentorName = mentorCard.querySelector('h3').textContent;
            
            const mentorId = mentorCard.getAttribute('data-user-id');
            
            if (mentorId) {
                sessionStorage.setItem('activeChatMentorId', mentorId);
                sessionStorage.setItem('activeChatMentorName', mentorName);
                
                window.location.href = 'chat.html';
            } else {
                showNotification('Could not find mentor details', 'error');
            }
        });
    });

    const connectButtons = document.querySelectorAll('.bg-white.rounded-xl .space-x-2 button.bg-blue-600');
    console.log('Found connect buttons:', connectButtons.length);
    
    connectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Connect button clicked');
            
            const mentorCard = this.closest('.bg-white.rounded-xl');
            const mentorName = mentorCard.querySelector('h3').textContent;
            
            const mentorId = mentorCard.getAttribute('data-user-id');
            
            showNotification(`Connection request sent to ${mentorName}`, 'success');
            
            this.textContent = 'Pending';
            this.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            this.classList.add('bg-gray-400', 'cursor-not-allowed');
            this.disabled = true;
        });
    });
}

function setupLogoutFunctionality() {
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    const mobileLogoutBtn = document.getElementById('mobile-logout-button');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}


function logout() {
    if (window.socketClient && window.socketClient.connected) {
        window.socketClient.disconnect();
    }
    
    
    sessionStorage.clear();
    localStorage.clear();
    
    
    window.location.href = 'login.html';
}


function initializeTabs() {
    const tabButtons = [
        document.getElementById('mentors-tab'),
        document.getElementById('upcoming-tab'),
        document.getElementById('badges-tab'),
        document.getElementById('goals-tab')
    ];
    
    const tabContents = [
        document.getElementById('mentors-content'),
        document.getElementById('upcoming-content'),
        document.getElementById('badges-content'),
        document.getElementById('goals-content')
    ];
    
    if (!tabButtons[0] || !tabContents[0]) return;
    
    
    tabButtons.forEach((button, index) => {
        if (!button) return;
        
        button.addEventListener('click', () => {
            
            tabButtons.forEach(btn => {
                if (!btn) return;
                btn.classList.remove('border-blue-500', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            button.classList.remove('border-transparent', 'text-gray-500');
            button.classList.add('border-blue-500', 'text-blue-600');
            
            
            tabContents.forEach((content, i) => {
                if (!content) return;
                if (i === index) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
}


function initializeUserData(user) {
    const userGreeting = document.querySelector('.user-greeting');
    const userName = document.querySelector('.user-name');
    const userEmail = document.querySelector('.user-email');
    const profileImages = document.querySelectorAll('img[src="assets/profile-placeholder.svg"]');
    
    
    if (userGreeting) {
        userGreeting.textContent = `Hello, ${user.firstName}!`;
    }
    
    if (userName) {
        userName.textContent = `${user.firstName} ${user.lastName}`;
    }
    
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    
    if (profileImages.length > 0 && user.profileImage) {
        profileImages.forEach(img => {
            img.src = user.profileImage;
        });
    }
}


function initializeProfileDropdown() {
    const userMenuButton = document.getElementById('user-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (userMenuButton && profileDropdown) {
        userMenuButton.addEventListener('click', function() {
            profileDropdown.classList.toggle('hidden');
            
            const activeUsersSection = document.getElementById('active-users-section');
            if (activeUsersSection && !activeUsersSection.classList.contains('hidden')) {
                activeUsersSection.classList.add('hidden');
            }
        });
        
        
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !profileDropdown.contains(event.target)) {
                profileDropdown.classList.add('hidden');
            }
        });
    }
    
    
    initializeActiveUsersToggle();
}


function initializeActiveUsersToggle() {
    const activeUsersToggle = document.getElementById('active-users-toggle');
    const activeUsersSection = document.getElementById('active-users-section');
    
    if (activeUsersToggle && activeUsersSection) {
        activeUsersToggle.addEventListener('click', function() {
            activeUsersSection.classList.toggle('hidden');
            
            const profileDropdown = document.getElementById('profile-dropdown');
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
        });
        
        
        document.addEventListener('click', function(event) {
            if (!activeUsersToggle.contains(event.target) && !activeUsersSection.contains(event.target)) {
                activeUsersSection.classList.add('hidden');
            }
        });
    }
}


function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (!mobileMenuButton || !mobileMenu) return;
    
    mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
    });
}


function setupActiveUsersDisplay(currentUser) {
    
    let activeUsersSection = document.getElementById('active-users-section');
    
    if (!activeUsersSection) {
        const mainContent = document.querySelector('main');
        
        if (mainContent) {
            activeUsersSection = document.createElement('div');
            activeUsersSection.id = 'active-users-section';
            activeUsersSection.className = 'fixed right-4 top-20 bg-white rounded-lg shadow-md p-4 w-64 z-10';
            activeUsersSection.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">Active Users <span id="active-users-count" class="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2">0</span></h3>
                <div id="active-users-list" class="space-y-3 max-h-80 overflow-y-auto"></div>
            `;
            mainContent.appendChild(activeUsersSection);
        }
    }
    
    
    updateActiveUsers(currentUser);
}


function updateActiveUsers(currentUser) {
    const activeUsersList = document.getElementById('active-users-list');
    const activeUsersCount = document.getElementById('active-users-count');
    const activeUsersBadge = document.getElementById('active-users-badge');
    
    if (!activeUsersList || !activeUsersCount || !activeUsersBadge) return;
    
    
    let activeUsers = {};
    
    if (window.socketClient && window.socketClient.connected) {
        
        window.socketClient.getOnlineUsers();
        
        
        activeUsers = window.sharedData.getActiveUsers();
    } else {
        
        activeUsers = window.sharedData.getActiveUsers();
    }
    
    
    const filteredUsers = { ...activeUsers };
    delete filteredUsers[currentUser.id];
    
    
    
    if (Object.keys(filteredUsers).length === 0) {
        
        filteredUsers['user002'] = {
            id: 'user002',
            firstName: 'Aditya',
            lastName: 'Agarwal',
            userType: 'mentor',
            profileImage: 'assets/mentor-2.svg',
            status: 'online'
        };
    }
    
    
    const userCount = Object.keys(filteredUsers).length;
    activeUsersCount.textContent = userCount;
    activeUsersBadge.textContent = userCount;
    
    
    if (userCount === 0) {
        activeUsersList.innerHTML = '<p class="text-gray-500 text-sm">No other users online</p>';
        return;
    }
    
    
    let html = '';
    Object.values(filteredUsers).forEach(user => {
        html += `
            <div class="flex items-center">
                <div class="relative">
                    <img src="${user.profileImage || 'assets/profile-placeholder.svg'}" alt="${user.firstName}" class="w-10 h-10 rounded-full">
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium">${user.firstName} ${user.lastName}</p>
                    <p class="text-xs text-gray-500">${user.userType === 'mentor' ? 'Mentor' : 'Student'}</p>
                </div>
                <div class="ml-auto">
                    <button data-user-id="${user.id}" class="message-user-btn text-blue-600 hover:text-blue-800">
                        <i class="fas fa-comment-dots"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    activeUsersList.innerHTML = html;
    
    
    const messageButtons = activeUsersList.querySelectorAll('.message-user-btn');
    messageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            
            window.location.href = `chat.html?userId=${userId}`;
        });
    });
}


function updateUserStatuses(statuses) {
    if (!statuses) return;
    
    
    for (const userId in statuses) {
        if (statuses[userId] === true) {
            
            const user = window.mockUsers.find(u => u.id === userId);
            if (user) {
                window.sharedData.setUserActive(user);
            }
        } else {
            window.sharedData.setUserInactive(userId);
        }
    }
}


function checkConnectionRequests(currentUser) {
    
    if (window.socketClient && window.socketClient.connected) {
        
        
    } else {
        
        const requests = window.sharedData.getConnectionRequests(currentUser.id);
        showConnectionRequests(requests, currentUser);
    }
}


function showConnectionRequests(requests, currentUser) {
    if (!requests || requests.length === 0) return;
    
    
    let notificationsContainer = document.getElementById('notifications-container');
    
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notifications-container';
        notificationsContainer.className = 'fixed right-4 top-20 z-50 max-w-sm w-full space-y-4';
        document.body.appendChild(notificationsContainer);
    }
    
    
    requests.forEach(request => {
        
        const existingNotification = document.getElementById(`request-${request.id}`);
        if (existingNotification) return;
        
        
        const fromUser = window.mockUsers.find(user => user.id === request.fromUserId);
        
        if (fromUser) {
            
            const notification = document.createElement('div');
            notification.id = `request-${request.id}`;
            notification.className = 'bg-white rounded-lg shadow-md p-4 transition-all transform animate-notification';
            notification.innerHTML = `
                <div class="flex items-start mb-3">
                    <img src="${fromUser.profileImage || 'assets/profile-placeholder.svg'}" alt="${fromUser.firstName}" class="w-10 h-10 rounded-full mr-3">
                    <div class="flex-1">
                        <p class="font-medium">${fromUser.firstName} ${fromUser.lastName}</p>
                        <p class="text-sm text-gray-600">Wants to connect with you</p>
                    </div>
                    <button class="close-notification text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="flex space-x-2">
                    <button class="accept-request bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition">
                        Accept
                    </button>
                    <button class="decline-request bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-300 transition">
                        Decline
                    </button>
                </div>
            `;
            
            
            notificationsContainer.appendChild(notification);
            
            
            notification.querySelector('.close-notification').addEventListener('click', function() {
                notification.remove();
            });
            
            notification.querySelector('.accept-request').addEventListener('click', function() {
                if (window.socketClient && window.socketClient.connected) {
                    window.socketClient.acceptConnectionRequest(request.id, currentUser.id);
                } else {
                    window.sharedData.acceptConnectionRequest(request.id);
                }
                notification.remove();
                showNotification(`You are now connected with ${fromUser.firstName}`, 'success');
            });
            
            notification.querySelector('.decline-request').addEventListener('click', function() {
                if (window.socketClient && window.socketClient.connected) {
                    window.socketClient.declineConnectionRequest(request.id, currentUser.id);
                } else {
                    window.sharedData.declineConnectionRequest(request.id);
                }
                notification.remove();
                showNotification(`Request from ${fromUser.firstName} declined`, 'info');
            });
        }
    });
}


function loadPersonalizedContent(user) {
    
    if (user.userType === 'mentor') {
        fetchMenteeRecommendations(user);
        updateMentorDashboard(user);
    } else {
        fetchMentorRecommendations(user);
        updateMenteeDashboard(user);
    }
    
    fetchUserBadges(user);
    fetchUserGoals(user);
    fetchRelevantCommunities(user);
}


function updateMentorDashboard(user) {
    
    const welcomeSection = document.querySelector('.mb-8.bg-white.rounded-lg.shadow.p-6');
    if (welcomeSection) {
        const welcomeTitle = welcomeSection.querySelector('h1');
        const welcomeDescription = welcomeSection.querySelector('p');
        
        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome back, ${user.firstName}!`;
        }
        
        if (welcomeDescription) {
            welcomeDescription.textContent = 'Your mentee dashboard is ready';
        }
    }
    
    
    const tabTitles = document.querySelectorAll('button[id$="-tab"]');
    if (tabTitles.length >= 4) {
        tabTitles[0].textContent = 'Your Mentees';
        tabTitles[1].textContent = 'Scheduled Sessions';
        
    }
}

function updateMenteeDashboard(user) {
    
}


function fetchMenteeRecommendations(user) {
    console.log('Fetching mentee recommendations for', user.firstName);
    
    
    if (user.userType === 'mentor') {
        const mentorsContent = document.getElementById('mentors-content');
        if (mentorsContent) {
            const header = mentorsContent.querySelector('h2');
            const description = mentorsContent.querySelector('p');
            
            if (header) {
                header.textContent = 'Your Current Mentees';
            }
            
            if (description) {
                description.textContent = 'Students you are currently mentoring';
            }
            
            
            const mentorCards = document.querySelectorAll('#mentors-content .grid > div');
            for (let i = 0; i < mentorCards.length; i++) {
                const nameElem = mentorCards[i].querySelector('h3');
                if (nameElem && (nameElem.textContent.includes(user.firstName) && nameElem.textContent.includes(user.lastName))) {
                    mentorCards[i].remove();
                }
            }
        }
    }
}


function fetchMentorRecommendations(user) {
    
    console.log('Fetching mentor recommendations for', user.firstName);
    
    
    if (user.userType === 'mentor') {
        return;
    }
    
    
    const mentorCards = document.querySelectorAll('#mentors-content .grid > div');
    for (let i = 0; i < mentorCards.length; i++) {
        const nameElem = mentorCards[i].querySelector('h3');
        if (nameElem && (nameElem.textContent.includes(user.firstName) && nameElem.textContent.includes(user.lastName))) {
            mentorCards[i].remove();
        }
    }
    
    
    const remainingCards = document.querySelectorAll('#mentors-content .grid > div');
    
    
    if (remainingCards.length > 0 && user.skills && user.interests) {
        
        const mentorIds = {
            'Alex Johnson': 'user_123',
            'Sarah Wilson': 'user_456',
            'Michael Brown': 'user_789',
            'Aditya Sharma': 'user_101112',
            'Emily Roberts': 'user_131415'
        };
        
        remainingCards.forEach((card, index) => {
            const matchElement = card.querySelector('.text-green-600');
            if (matchElement) {
                
                const baseMatch = 95 - (index * 5);
                const personalizedMatch = baseMatch - Math.floor(Math.random() * 5);
                matchElement.textContent = `${personalizedMatch}% Match`;
            }
            
            
            const mentorName = card.querySelector('h3').textContent.trim();
            const mentorId = mentorIds[mentorName] || `user_${Math.floor(Math.random() * 100000)}`;
            card.setAttribute('data-user-id', mentorId);
            
            
            const skillElements = card.querySelectorAll('.bg-blue-100');
            if (skillElements.length > 0) {
                skillElements.forEach(skill => {
                    if (user.interests.includes(skill.textContent.trim())) {
                        skill.classList.remove('bg-blue-100', 'text-blue-800');
                        skill.classList.add('bg-green-100', 'text-green-800');
                    }
                });
            }
            
            
            const connectButton = card.querySelector('button.bg-blue-600, button.bg-blue-500');
            if (connectButton) {
                connectButton.addEventListener('click', function() {
                    const cardElement = this.closest('div.rounded-xl');
                    const mentorName = cardElement.querySelector('h3').textContent.trim();
                    const mentorId = cardElement.getAttribute('data-user-id');
                    
                    if (mentorId) {
                        console.log(`Sending connection request to: ${mentorName} with ID: ${mentorId}`);
                        
                        const success = window.sharedData.sendConnectionRequest(user.id, mentorId);
                        
                        if (success) {
                            
                            showNotification(`Connection request sent to ${mentorName}`, 'success');
                            this.textContent = 'Pending';
                            this.classList.remove('bg-blue-600', 'bg-blue-500', 'hover:bg-blue-700');
                            this.classList.add('bg-gray-500', 'hover:bg-gray-600');
                            this.disabled = true;
                        } else {
                            showNotification('You already sent a request to this mentor', 'warning');
                        }
                    } else {
                        showNotification('Could not find this mentor in the system', 'error');
                    }
                });
            }
            
            
            const messageButton = card.querySelector('button.border-blue-600, button.border-blue-500');
            if (messageButton) {
                messageButton.addEventListener('click', function() {
                    const mentorName = this.closest('div.rounded-xl').querySelector('h3').textContent.trim();
                    const mentorId = this.closest('div.rounded-xl').getAttribute('data-user-id');
                    
                    if (mentorId) {
                        
                        window.location.href = `chat.html?userId=${mentorId}`;
                    } else {
                        showNotification('Could not find this mentor in the system', 'error');
                    }
                });
            }
        });
    }
}


function getMentorIdByName(fullName) {
    if (!window.mockUsers) return null;
    
    
    fullName = fullName.trim();
    
    for (const user of window.mockUsers) {
        const userName = `${user.firstName} ${user.lastName}`;
        if (userName === fullName) {
            return user.id;
        }
    }
    
    return null;
}


function fetchUserBadges(user) {
    
    console.log('Fetching badges for', user.firstName);
    
    
    const badgesContent = document.getElementById('badges-content');
    if (badgesContent) {
        const badgeElements = badgesContent.querySelectorAll('.grid > div');
        
        
        if (user.userType === 'mentor') {
            
            if (badgeElements.length >= 5) {
                const badgeTitles = ['Mentor Star', 'Dedicated Guide', 'Knowledge Sharer', 'Session Expert', 'Community Leader'];
                const badgeDescriptions = ['Highly rated mentor', 'Consistent availability', 'Shared valuable resources', 'Conducted 10+ sessions', 'Active in communities'];
                
                badgeElements.forEach((badge, index) => {
                    const title = badge.querySelector('h3');
                    const description = badge.querySelector('p');
                    
                    if (title && index < badgeTitles.length) {
                        title.textContent = badgeTitles[index];
                    }
                    
                    if (description && index < badgeDescriptions.length) {
                        description.textContent = badgeDescriptions[index];
                    }
                    
                    
                    if (index < 3 && user.rating >= 4.0) {
                        badge.classList.remove('opacity-50');
                        const iconContainer = badge.querySelector('.bg-gray-100');
                        if (iconContainer) {
                            iconContainer.classList.remove('bg-gray-100');
                            iconContainer.classList.add('bg-blue-100');
                        }
                        
                        const icon = badge.querySelector('.text-gray-400');
                        if (icon) {
                            icon.classList.remove('text-gray-400');
                            icon.classList.add('text-blue-600');
                        }
                    }
                });
            }
        }
    }
}


function fetchUserGoals(user) {
    
    console.log('Fetching goals for', user.firstName);
    
    
    const goalsContent = document.getElementById('goals-content');
    if (goalsContent && user.userType === 'mentor') {
        const goalElements = goalsContent.querySelectorAll('.bg-white.rounded-lg');
        
        if (goalElements.length >= 2) {
            
            const firstGoal = goalElements[0];
            if (firstGoal) {
                const title = firstGoal.querySelector('h3');
                const description = firstGoal.querySelector('p.text-gray-600.text-sm');
                const status = firstGoal.querySelector('.bg-yellow-100');
                const progress = firstGoal.querySelector('.bg-blue-600');
                const progressText = firstGoal.querySelector('span.font-semibold');
                
                if (title) title.textContent = 'Help 5 students with interview prep';
                if (description) description.textContent = 'Guide students through technical interview practice sessions';
                if (progress) progress.style.width = '60%';
                if (progressText) progressText.textContent = '3/5 completed';
            }
            
            
            const secondGoal = goalElements[1];
            if (secondGoal) {
                const title = secondGoal.querySelector('h3');
                const description = secondGoal.querySelector('p.text-gray-600.text-sm');
                
                if (title) title.textContent = 'Create learning resources';
                if (description) description.textContent = 'Develop tutorials and guides for students in your area of expertise';
            }
        }
    }
    
    
    const goalDetailLinks = document.querySelectorAll('#goals-content a');
    goalDetailLinks.forEach(link => {
        link.addEventListener('click', function() {
            const goalName = this.closest('div.bg-white').querySelector('h3').textContent;
            showNotification(`Viewing details for goal: ${goalName}`, 'info');
        });
    });
}


function fetchRelevantCommunities(user) {
    console.log('Fetching communities for', user.firstName);
    
}


function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 ${
        type === 'info' ? 'bg-blue-600 text-white' : 
        type === 'success' ? 'bg-green-600 text-white' : 
        type === 'warning' ? 'bg-yellow-600 text-white' : 
        'bg-red-600 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'info' ? 'fa-info-circle' : 
                type === 'success' ? 'fa-check-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 
                'fa-times-circle'
            } mr-3 text-xl"></i>
            <div>${message}</div>
            <button class="ml-auto text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
