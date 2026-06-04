

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    checkAuthStatus();
});

function checkAuthStatus() {
   
    const isLoggedIn = localStorage.getItem('mentorConnectLoggedIn') === 'true';
    
    const loginButtons = document.querySelectorAll('.login-button');
    const logoutButtons = document.querySelectorAll('.logout-button');
    const profileButtons = document.querySelectorAll('.profile-button');
    
    if (isLoggedIn) {
        loginButtons.forEach(button => button.classList.add('hidden'));
        logoutButtons.forEach(button => button.classList.remove('hidden'));
        profileButtons.forEach(button => button.classList.remove('hidden'));
        
        if (window.location.pathname.includes('login.html') && !window.location.search.includes('signup=true')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        loginButtons.forEach(button => button.classList.remove('hidden'));
        logoutButtons.forEach(button => button.classList.add('hidden'));
        profileButtons.forEach(button => button.classList.add('hidden'));
        
        const protectedPages = ['dashboard.html', 'chat.html', 'profile.html', 'goals.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

const userMenuButton = document.getElementById('user-menu-button');
const profileDropdown = document.getElementById('profile-dropdown');

if (userMenuButton && profileDropdown) {
    userMenuButton.addEventListener('click', function() {
        profileDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', function(event) {
        if (!userMenuButton.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
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

function animateOnScroll() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

if (document.querySelector('.animate-on-scroll')) {
    animateOnScroll();
}
