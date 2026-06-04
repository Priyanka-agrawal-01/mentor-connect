
document.addEventListener('DOMContentLoaded', function() {
    
    initializeCommunities();

    
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    
    const communityTabs = document.querySelectorAll('.community-tab');
    
    if (communityTabs.length > 0) {
        communityTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                
                communityTabs.forEach(t => {
                    t.classList.remove('active', 'text-indigo-600', 'border-indigo-600');
                    t.classList.add('text-gray-500', 'hover:text-indigo-800');
                });
                
                
                e.currentTarget.classList.add('active', 'text-indigo-600', 'border-indigo-600');
                e.currentTarget.classList.remove('text-gray-500', 'hover:text-indigo-800');
                
                
                const type = e.currentTarget.getAttribute('data-type');
                filterCommunitiesByType(type);
            });
        });
    }

    
    const communitySearch = document.getElementById('community-search');
    
    if (communitySearch) {
        communitySearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterCommunitiesBySearch(searchTerm);
        });
    }

    
    const loadMoreBtn = document.getElementById('load-more-communities');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadMoreCommunities();
        });
    }
    
    
    const updatePreferencesBtn = document.getElementById('update-preferences-btn');
    if (updatePreferencesBtn) {
        updatePreferencesBtn.addEventListener('click', () => {
            updateUserPreferences();
        });
    }
    
    
    const findCommunitiesBtn = document.getElementById('find-communities-btn');
    if (findCommunitiesBtn) {
        findCommunitiesBtn.addEventListener('click', () => {
            findRecommendedCommunities();
        });
    }
});


let allCommunities = [];
let userCommunities = [];
let currentPage = 1;
let selectedType = 'all';
let lastSearchTerm = '';
let displayedCommunities = 6; 


const mockCommunities = [
    {
        id: 'cs-2024',
        name: 'CSE Batch 2024',
        type: 'batch',
        category: '2024',
        branch: 'computer-science',
        description: 'A community for Computer Science Engineering students from the batch of 2024.',
        memberCount: 156,
        isPublic: true,
        createdAt: '2023-06-15',
        color: 'indigo',
        isMember: true
    },
    {
        id: 'ai-ml',
        name: 'AI & ML Enthusiasts',
        type: 'interest',
        category: 'artificial-intelligence',
        description: 'For students interested in Artificial Intelligence and Machine Learning.',
        memberCount: 234,
        isPublic: true,
        createdAt: '2023-01-10',
        color: 'green',
        isMember: true
    },
    {
        id: 'web-dev',
        name: 'Web Development',
        type: 'interest',
        category: 'web-development',
        description: 'Connect with fellow web developers and share knowledge about the latest technologies.',
        memberCount: 189,
        isPublic: true,
        createdAt: '2023-02-22',
        color: 'yellow',
        isMember: true
    },
    {
        id: 'ece-2023',
        name: 'ECE Batch 2023',
        type: 'batch',
        category: '2023',
        branch: 'electronics',
        description: 'A community for Electronics and Communication Engineering students from the batch of 2023.',
        memberCount: 112,
        isPublic: true,
        createdAt: '2022-12-05',
        color: 'blue',
        isMember: false
    },
    {
        id: 'mech-community',
        name: 'Mechanical Engineering Hub',
        type: 'branch',
        category: 'mechanical',
        description: 'A dedicated space for mechanical engineering students to connect and collaborate.',
        memberCount: 97,
        isPublic: true,
        createdAt: '2023-03-14',
        color: 'red',
        isMember: false
    },
    {
        id: 'data-science',
        name: 'Data Science Network',
        type: 'interest',
        category: 'data-science',
        description: 'A group for data science enthusiasts to discuss projects, techniques, and opportunities.',
        memberCount: 178,
        isPublic: true,
        createdAt: '2023-04-03',
        color: 'purple',
        isMember: false
    },
    {
        id: 'it-2022',
        name: 'IT Batch 2022',
        type: 'batch',
        category: '2022',
        branch: 'information-technology',
        description: 'For IT students from the batch of 2022 to stay connected and share experiences.',
        memberCount: 143,
        isPublic: true,
        createdAt: '2022-08-22',
        color: 'blue',
        isMember: false
    },
    {
        id: 'civil-eng',
        name: 'Civil Engineering Community',
        type: 'branch',
        category: 'civil',
        description: 'Connect with fellow civil engineering students and professionals.',
        memberCount: 84,
        isPublic: true,
        createdAt: '2023-02-18',
        color: 'gray',
        isMember: false
    },
    {
        id: 'mobile-dev',
        name: 'Mobile App Developers',
        type: 'interest',
        category: 'mobile-development',
        description: 'A community for Android, iOS, and cross-platform mobile app developers.',
        memberCount: 156,
        isPublic: true,
        createdAt: '2023-05-12',
        color: 'blue',
        isMember: false
    },
    {
        id: 'cloud-computing',
        name: 'Cloud Computing Group',
        type: 'interest',
        category: 'cloud-computing',
        description: 'Discuss cloud platforms, services, and best practices with fellow enthusiasts.',
        memberCount: 112,
        isPublic: true,
        createdAt: '2023-03-27',
        color: 'teal',
        isMember: false
    },
    {
        id: 'cs-2023',
        name: 'CSE Batch 2023',
        type: 'batch',
        category: '2023',
        branch: 'computer-science',
        description: 'A community for Computer Science Engineering students from the batch of 2023.',
        memberCount: 168,
        isPublic: true,
        createdAt: '2022-07-08',
        color: 'indigo',
        isMember: false
    },
    {
        id: 'ece-community',
        name: 'Electronics Engineers',
        type: 'branch',
        category: 'electronics',
        description: 'Share knowledge and collaborate on electronics and communication engineering projects.',
        memberCount: 132,
        isPublic: true,
        createdAt: '2023-01-30',
        color: 'yellow',
        isMember: false
    }
];


function initializeCommunities() {
    
    allCommunities = mockCommunities;
    userCommunities = mockCommunities.filter(community => community.isMember);
    
    
    renderCommunities(allCommunities.slice(0, displayedCommunities));
    renderUserCommunities(userCommunities);
}


function renderCommunities(communities) {
    const communitiesGrid = document.getElementById('communities-grid');
    
    if (!communitiesGrid) return;
    
    
    communitiesGrid.innerHTML = '';
    
    if (communities.length === 0) {
        communitiesGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500">No communities found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    communities.forEach(community => {
        const communityCard = document.createElement('div');
        communityCard.className = 'overflow-hidden rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition';
        communityCard.setAttribute('data-community-id', community.id);
        communityCard.setAttribute('data-community-type', community.type);
        
        let categoryBadge = '';
        let bgColor = '';
        
        if (community.type === 'branch') {
            categoryBadge = `<span class="bg-indigo-700 text-xs px-2 py-1 rounded">Branch</span>`;
            bgColor = 'bg-indigo-600';
        } else if (community.type === 'batch') {
            categoryBadge = `<span class="bg-blue-700 text-xs px-2 py-1 rounded">Batch</span>`;
            bgColor = 'bg-blue-600';
        } else if (community.type === 'interest') {
            categoryBadge = `<span class="bg-purple-700 text-xs px-2 py-1 rounded">Interest</span>`;
            bgColor = 'bg-purple-600';
        }
        
        communityCard.innerHTML = `
            <div class="${bgColor} h-32 relative">
                <div class="absolute bottom-0 left-0 p-4 text-white">
                    ${categoryBadge}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1">${community.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${community.description.substring(0, 80)}${community.description.length > 80 ? '...' : ''}</p>
                <div class="flex items-center text-sm text-gray-500 mb-4">
                    <span class="flex items-center mr-4">
                        <i class="fas fa-users mr-1"></i> ${community.memberCount} members
                    </span>
                    <span class="flex items-center">
                        <i class="fas fa-calendar-alt mr-1"></i> ${formatDate(community.createdAt)}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <a href="community-detail.html?id=${community.id}" class="text-indigo-600 hover:text-indigo-800">View Details</a>
                    <button class="join-community-btn px-3 py-1 rounded text-sm ${community.isMember ? 'bg-gray-200 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}" 
                        data-community-id="${community.id}" ${community.isMember ? 'disabled' : ''}>
                        ${community.isMember ? 'Joined' : 'Join'}
                    </button>
                </div>
            </div>
        `;
        
        communitiesGrid.appendChild(communityCard);
    });
    
    
    const joinButtons = document.querySelectorAll('.join-community-btn');
    joinButtons.forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const communityId = button.getAttribute('data-community-id');
                joinCommunity(communityId, button);
            });
        }
    });
    
    
    const communityCards = document.querySelectorAll('#communities-grid > div');
    communityCards.forEach(card => {
        card.addEventListener('click', () => {
            const communityId = card.getAttribute('data-community-id');
            window.location.href = `community-detail.html?id=${communityId}`;
        });
    });
}


function renderUserCommunities(communities) {
    const userCommunitiesList = document.getElementById('my-communities-list');
    
    if (!userCommunitiesList) return;
    
    
    userCommunitiesList.innerHTML = '';
    
    if (communities.length === 0) {
        userCommunitiesList.innerHTML = `
            <li class="text-gray-500 text-sm py-2">
                You are not a member of any communities yet.
            </li>
        `;
        return;
    }
    
    const colors = ['indigo', 'green', 'yellow', 'blue', 'red', 'purple'];
    
    communities.forEach((community, index) => {
        const colorIndex = index % colors.length;
        const colorClass = `bg-${colors[colorIndex]}-500`;
        
        const communityItem = document.createElement('li');
        communityItem.className = 'flex items-center py-2 hover:bg-indigo-50 rounded px-2';
        communityItem.innerHTML = `
            <span class="w-3 h-3 ${colorClass} rounded-full mr-2"></span>
            <a href="community-detail.html?id=${community.id}" class="text-indigo-600 hover:text-indigo-800">${community.name}</a>
        `;
        
        userCommunitiesList.appendChild(communityItem);
    });
}


function filterCommunitiesByType(type) {
    selectedType = type;
    let filteredCommunities = [...allCommunities];
    
    if (type !== 'all') {
        filteredCommunities = allCommunities.filter(community => community.type === type);
    }
    
    
    if (lastSearchTerm) {
        filteredCommunities = filterBySearch(filteredCommunities, lastSearchTerm);
    }
    
    
    currentPage = 1;
    renderCommunities(filteredCommunities.slice(0, displayedCommunities));
}


function filterCommunitiesBySearch(searchTerm) {
    lastSearchTerm = searchTerm;
    let filteredCommunities = [...allCommunities];
    
    
    if (selectedType !== 'all') {
        filteredCommunities = filteredCommunities.filter(community => community.type === selectedType);
    }
    
    
    if (searchTerm) {
        filteredCommunities = filterBySearch(filteredCommunities, searchTerm);
    }
    
    
    currentPage = 1;
    renderCommunities(filteredCommunities.slice(0, displayedCommunities));
}


function filterBySearch(communities, searchTerm) {
    return communities.filter(community => {
        return (
            community.name.toLowerCase().includes(searchTerm) ||
            community.description.toLowerCase().includes(searchTerm) ||
            community.category.toLowerCase().includes(searchTerm)
        );
    });
}


function updateUserPreferences() {
    const branchSelect = document.getElementById('user-branch');
    const batchSelect = document.getElementById('user-batch');
    const interestCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="interest-"]');
    
    let interests = [];
    interestCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            interests.push(checkbox.value);
        }
    });
    
    
    
    showToast('Your preferences have been updated!');
    
    
    findRecommendedCommunities();
}


function findRecommendedCommunities() {
    const branchSelect = document.getElementById('user-branch');
    const batchSelect = document.getElementById('user-batch');
    const interestCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="interest-"]:checked');
    
    const branch = branchSelect ? branchSelect.value : '';
    const batch = batchSelect ? batchSelect.value : '';
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);
    
    
    let recommendedCommunities = allCommunities.filter(community => {
        if (community.type === 'branch' && community.category === branch) {
            return true;
        }
        if (community.type === 'batch' && community.category === batch) {
            return true;
        }
        if (community.type === 'interest' && interests.includes(community.category)) {
            return true;
        }
        return false;
    });
    
    
    if (recommendedCommunities.length === 0) {
        showToast('No exact matches found. Showing all communities.', 'info');
        recommendedCommunities = allCommunities;
    } else {
        showToast(`Found ${recommendedCommunities.length} communities that match your interests!`, 'success');
    }
    
    
    selectedType = 'all';
    lastSearchTerm = '';
    currentPage = 1;
    
    
    const allTab = document.querySelector('.community-tab[data-type="all"]');
    if (allTab) {
        const communityTabs = document.querySelectorAll('.community-tab');
        communityTabs.forEach(t => {
            t.classList.remove('active', 'text-indigo-600', 'border-indigo-600');
            t.classList.add('text-gray-500', 'hover:text-indigo-800');
        });
        allTab.classList.add('active', 'text-indigo-600', 'border-indigo-600');
        allTab.classList.remove('text-gray-500', 'hover:text-indigo-800');
    }
    
    
    renderCommunities(recommendedCommunities.slice(0, displayedCommunities));
}


function joinCommunity(communityId, buttonElement) {
    
    const communityIndex = allCommunities.findIndex(c => c.id === communityId);
    
    if (communityIndex === -1) return;
    
    
    allCommunities[communityIndex].isMember = true;
    
    
    buttonElement.textContent = 'Joined';
    buttonElement.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
    buttonElement.classList.add('bg-gray-200', 'text-gray-600');
    buttonElement.disabled = true;
    
    
    userCommunities.push(allCommunities[communityIndex]);
    
    
    renderUserCommunities(userCommunities);
    
    
    showToast(`You have joined ${allCommunities[communityIndex].name}!`);
}


function loadMoreCommunities() {
    currentPage++;
    
    let filteredCommunities = [...allCommunities];
    
    
    if (selectedType !== 'all') {
        filteredCommunities = filteredCommunities.filter(community => community.type === selectedType);
    }
    
    
    if (lastSearchTerm) {
        filteredCommunities = filterBySearch(filteredCommunities, lastSearchTerm);
    }
    
    const start = (currentPage - 1) * displayedCommunities;
    const end = currentPage * displayedCommunities;
    
    
    if (end >= filteredCommunities.length) {
        document.getElementById('load-more-communities').classList.add('hidden');
    }
    
    renderCommunities(filteredCommunities.slice(start, end));
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}


function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-all transform translate-y-0 opacity-100 z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'info' ? 'bg-blue-500' : 'bg-green-500'
    } text-white`;
    
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'info' ? 'fa-info-circle' : 'fa-check-circle'
            } mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    
    setTimeout(() => {
        toast.classList.add('translate-y-0', 'opacity-100');
        toast.classList.remove('translate-y-full', 'opacity-0');
    }, 10);
    
    
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
        
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
