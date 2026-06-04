


document.addEventListener('DOMContentLoaded', function() {
    
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    
    
    
    
    
    const script = document.createElement('script');
    script.src = 'js/mockUsers.js';
    script.onload = function() {
        
        initializeMockUsersByEmail();
        
        
        checkExistingLogin();
    };
    document.head.appendChild(script);
    
    
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const googleLoginBtn = document.getElementById('google-login');
    const linkedinLoginBtn = document.getElementById('linkedin-login');
    const googleSignupBtn = document.getElementById('google-signup');
    const linkedinSignupBtn = document.getElementById('linkedin-signup');
    const verificationDocInput = document.getElementById('verification-document');
    const fileUploadName = document.getElementById('file-upload-name');
    
    
    if (verificationDocInput && fileUploadName) {
        verificationDocInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2); 
                fileUploadName.textContent = `Selected: ${fileName} (${fileSize} MB)`;
                fileUploadName.classList.add('text-green-600');
                
                
                if (this.files[0].size > 5 * 1024 * 1024) { 
                    fileUploadName.textContent = `File too large: ${fileName} (${fileSize} MB). Maximum size is 5MB.`;
                    fileUploadName.classList.remove('text-green-600');
                    fileUploadName.classList.add('text-red-600');
                    this.value = ''; 
                }
            } else {
                fileUploadName.textContent = '';
            }
        });
    }
    
    
    if (loginTab && signupTab) {
        
        if (window.location.search.includes('signup=true')) {
            showSignupForm();
        } else {
            showLoginForm();
        }
        
        
        loginTab.addEventListener('click', showLoginForm);
        signupTab.addEventListener('click', showSignupForm);
        
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }
        
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => handleOAuthLogin('google'));
        }
        
        if (linkedinLoginBtn) {
            linkedinLoginBtn.addEventListener('click', () => handleOAuthLogin('linkedin'));
        }
        
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', () => handleOAuthSignup('google'));
        }
        
        if (linkedinSignupBtn) {
            linkedinSignupBtn.addEventListener('click', () => handleOAuthSignup('linkedin'));
        }
    }
    
    
    const logoutButtons = document.querySelectorAll('#logout-button, #mobile-logout-button');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleLogout);
        }
    });
});


function initializeMockUsersByEmail() {
    if (window.mockUsers && !window.mockUsersByEmail) {
        window.mockUsersByEmail = {};
        window.mockUsers.forEach(user => {
            window.mockUsersByEmail[user.email] = user;
        });
        console.log('Mock users by email initialized');
    }
}


function checkExistingLogin() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser && currentUser.id) {
        if (isLoginPage) {
            
            window.location.href = 'dashboard.html';
        }
    } else if (!isLoginPage) {
        
        
        
    }
}


function showLoginForm() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginTab.classList.add('border-blue-600', 'text-blue-600');
    loginTab.classList.remove('border-transparent', 'text-gray-400');
    
    signupTab.classList.remove('border-blue-600', 'text-blue-600');
    signupTab.classList.add('border-transparent', 'text-gray-400');
    
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
}


function showSignupForm() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    signupTab.classList.add('border-blue-600', 'text-blue-600');
    signupTab.classList.remove('border-transparent', 'text-gray-400');
    
    loginTab.classList.remove('border-blue-600', 'text-blue-600');
    loginTab.classList.add('border-transparent', 'text-gray-400');
    
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
}


function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showAuthError('Please enter both email and password.');
        return;
    }
    
    
    if (!window.mockUsersByEmail && window.mockUsers) {
        initializeMockUsersByEmail();
    }
    
    
    if (window.mockUsersByEmail && window.mockUsersByEmail[email]) {
        const user = window.mockUsersByEmail[email];
        
        
        if (user.password === password) {
            
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            console.log('User logged in:', user.firstName, user.lastName);
            
            
            window.location.href = 'dashboard.html';
        } else {
            showAuthError('Invalid password. Try again.');
        }
    } else {
        showAuthError('Email not found. Please check your email or sign up.');
    }
}


function handleSignup(event) {
    event.preventDefault();
    
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const userTypeInputs = document.getElementsByName('user-type');
    const verificationDocInput = document.getElementById('verification-document');
    
    if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;
    
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    
    const branchInputs = document.getElementsByName('branch');
    const selectedBranches = [];
    for (const input of branchInputs) {
        if (input.checked) {
            selectedBranches.push(input.value);
        }
    }
    
    
    const batchInputs = document.getElementsByName('batch');
    const selectedBatches = [];
    for (const input of batchInputs) {
        if (input.checked) {
            selectedBatches.push(input.value);
        }
    }
    
    
    const interestInputs = document.getElementsByName('interest');
    const selectedInterests = [];
    for (const input of interestInputs) {
        if (input.checked) {
            selectedInterests.push(input.value);
        }
    }
    
    
    const verificationDoc = verificationDocInput ? verificationDocInput.files[0] : null;
    
    
    let userType = 'student'; 
    for (const input of userTypeInputs) {
        if (input.checked) {
            userType = input.value;
            break;
        }
    }
    
    
    if (!firstName || !lastName || !email || !password) {
        showAuthError('Please fill in all required fields.');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthError('Passwords do not match.');
        return;
    }
    
    if (password.length < 6) {
        showAuthError('Password should be at least 6 characters.');
        return;
    }
    
    if (selectedBranches.length === 0) {
        showAuthError('Please select at least one branch.');
        return;
    }
    
    if (selectedBatches.length === 0) {
        showAuthError('Please select at least one batch year.');
        return;
    }
    
    if (!verificationDoc) {
        showAuthError('Please upload a verification document.');
        return;
    }
    
    if (verificationDoc.size > 5 * 1024 * 1024) {
        showAuthError('Verification document too large. Maximum size is 5MB.');
        return;
    }
    
    
    if (window.mockUsersByEmail && window.mockUsersByEmail[email]) {
        showAuthError('This email is already registered. Please log in instead.');
        return;
    }
    
    
    const newUser = {
        id: 'user' + Date.now(), 
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        branches: selectedBranches,
        batchYears: selectedBatches,
        interests: selectedInterests,
        company: '',
        position: '',
        rating: 0,
        reviewCount: 0,
        skills: [],
        profileImage: 'assets/profile-placeholder.svg',
        status: 'active',
        bio: '',
        matchPercentage: 0,
        verificationStatus: 'pending', 
        verificationDoc: verificationDoc ? verificationDoc.name : '' 
    };
    
    
    if (window.mockUsers) {
        window.mockUsers.push(newUser);
        if (window.mockUsersByEmail) {
            window.mockUsersByEmail[email] = newUser;
        }
    }
    
    
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    console.log('New user created and logged in:', newUser.firstName, newUser.lastName);
    
    
    window.location.href = 'dashboard.html';
}


function handleOAuthLogin(provider) {
    
    if (window.mockUsers && window.mockUsers.length > 0) {
        const user = window.mockUsers[0]; 
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        console.log('OAuth login as:', user.firstName, user.lastName);
        window.location.href = 'dashboard.html';
    } else {
        showAuthError('Mock user database not loaded. Please try again.');
    }
}


function handleOAuthSignup(provider) {
    
    handleOAuthLogin(provider);
}


function handleLogout(event) {
    if (event) event.preventDefault();
    
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.firstName) {
        console.log('Logging out user:', currentUser.firstName, currentUser.lastName);
    }
    
    
    sessionStorage.removeItem('currentUser');
    
    
    window.location.href = 'login.html';
}


function showAuthError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
    errorContainer.setAttribute('role', 'alert');
    
    errorContainer.innerHTML = `
        <span class="block sm:inline">${message}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http:
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
        </span>
    `;
    
    
    const form = document.querySelector('form');
    if (form && form.parentNode) {
        form.parentNode.insertBefore(errorContainer, form);
    }
    
    
    const closeButton = errorContainer.querySelector('svg');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            errorContainer.remove();
        });
    }
    
    
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.remove();
        }
    }, 5000);
}


function simulateSuccessfulAuth() {
    if (window.mockUsers && window.mockUsers.length > 0) {
        const user = window.mockUsers[0]; 
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        console.log('Simulated login as:', user.firstName, user.lastName);
        window.location.href = 'dashboard.html';
    } else {
        
        window.location.href = 'dashboard.html';
    }
}
