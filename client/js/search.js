// MentorConnect - Search Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus().then(user => {
        if (user) {
            initializeSearch(user);
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

    // Search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    // Filter toggles
    const filterToggles = document.querySelectorAll('.filter-toggle');
    filterToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const target = document.getElementById(targetId);
            
            if (target) {
                target.classList.toggle('hidden');
                
                // Toggle icon
                const icon = toggle.querySelector('i');
                if (icon) {
                    if (target.classList.contains('hidden')) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-right');
                    } else {
                        icon.classList.remove('fa-chevron-right');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            }
        });
    });

    // Sort option change
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortResults(sortSelect.value);
        });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
        });
    }

    // View type toggle
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const resultsContainer = document.getElementById('search-results');
    
    if (gridViewBtn && listViewBtn && resultsContainer) {
        gridViewBtn.addEventListener('click', () => {
            resultsContainer.classList.remove('list-view');
            resultsContainer.classList.add('grid-view');
            
            gridViewBtn.classList.add('bg-indigo-600', 'text-white');
            gridViewBtn.classList.remove('bg-gray-200', 'text-gray-600');
            
            listViewBtn.classList.remove('bg-indigo-600', 'text-white');
            listViewBtn.classList.add('bg-gray-200', 'text-gray-600');
        });
        
        listViewBtn.addEventListener('click', () => {
            resultsContainer.classList.remove('grid-view');
            resultsContainer.classList.add('list-view');
            
            listViewBtn.classList.add('bg-indigo-600', 'text-white');
            listViewBtn.classList.remove('bg-gray-200', 'text-gray-600');
            
            gridViewBtn.classList.remove('bg-indigo-600', 'text-white');
            gridViewBtn.classList.add('bg-gray-200', 'text-gray-600');
        });
    }
});

// Global variables
let currentUser = null;
let searchResults = [];
let filtersApplied = {
    batch: [],
    branch: [],
    skills: [],
    interests: [],
    mentorshipStatus: false
};
let currentPage = 1;
let totalPages = 1;
let currentSort = 'relevance';

// Initialize the search page
function initializeSearch(user) {
    currentUser = user;
    
    // Attempt to get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        document.getElementById('search-input').value = query;
        performSearch();
    }
    
    // Initialize filter checkboxes event listeners
    initializeFilters();
}

// Initialize filter checkboxes
function initializeFilters() {
    // Batch checkboxes
    const batchCheckboxes = document.querySelectorAll('input[name="batch"]');
    batchCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateBatchFilters();
            applyFilters();
        });
    });
    
    // Branch checkboxes
    const branchCheckboxes = document.querySelectorAll('input[name="branch"]');
    branchCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateBranchFilters();
            applyFilters();
        });
    });
    
    // Skills checkboxes
    const skillsCheckboxes = document.querySelectorAll('input[name="skills"]');
    skillsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSkillsFilters();
            applyFilters();
        });
    });
    
    // Interests checkboxes
    const interestsCheckboxes = document.querySelectorAll('input[name="interests"]');
    interestsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateInterestsFilters();
            applyFilters();
        });
    });
    
    // Mentorship status checkbox
    const mentorshipCheckbox = document.getElementById('mentorship-filter');
    if (mentorshipCheckbox) {
        mentorshipCheckbox.addEventListener('change', () => {
            filtersApplied.mentorshipStatus = mentorshipCheckbox.checked;
            applyFilters();
        });
    }
}

// Update batch filters array
function updateBatchFilters() {
    const batchCheckboxes = document.querySelectorAll('input[name="batch"]:checked');
    filtersApplied.batch = Array.from(batchCheckboxes).map(cb => cb.value);
}

// Update branch filters array
function updateBranchFilters() {
    const branchCheckboxes = document.querySelectorAll('input[name="branch"]:checked');
    filtersApplied.branch = Array.from(branchCheckboxes).map(cb => cb.value);
}

// Update skills filters array
function updateSkillsFilters() {
    const skillsCheckboxes = document.querySelectorAll('input[name="skills"]:checked');
    filtersApplied.skills = Array.from(skillsCheckboxes).map(cb => cb.value);
}

// Update interests filters array
function updateInterestsFilters() {
    const interestsCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
    filtersApplied.interests = Array.from(interestsCheckboxes).map(cb => cb.value);
}

// Perform search
async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    // Update URL with search query for sharing/bookmarking
    const url = new URL(window.location);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    window.history.pushState({}, '', url);
    
    const searchResultsContainer = document.getElementById('search-results');
    if (searchResultsContainer) {
        // Show loading state
        searchResultsContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-10">
                <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        `;
    }
    
    try {
        const response = await axios.get('/api/search/users', {
            params: {
                q: query,
                page: 1,
                limit: 20
            }
        });
        
        searchResults = response.data.users;
        currentPage = response.data.page;
        totalPages = response.data.totalPages;
        
        // Apply any existing filters
        applyFilters();
        
        // Update search stats
        updateSearchStats(response.data.total);
        
    } catch (error) {
        console.error('Error performing search:', error);
        
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-red-600">Error performing search. Please try again.</p>
                </div>
            `;
        }
    }
}

// Apply filters to search results
function applyFilters() {
    let filteredResults = [...searchResults];
    
    // Filter by batch
    if (filtersApplied.batch.length > 0) {
        filteredResults = filteredResults.filter(user => 
            filtersApplied.batch.includes(user.batch)
        );
    }
    
    // Filter by branch
    if (filtersApplied.branch.length > 0) {
        filteredResults = filteredResults.filter(user => 
            filtersApplied.branch.includes(user.branch)
        );
    }
    
    // Filter by skills
    if (filtersApplied.skills.length > 0) {
        filteredResults = filteredResults.filter(user => 
            user.skills && filtersApplied.skills.some(skill => user.skills.includes(skill))
        );
    }
    
    // Filter by interests
    if (filtersApplied.interests.length > 0) {
        filteredResults = filteredResults.filter(user => 
            user.interests && filtersApplied.interests.some(interest => user.interests.includes(interest))
        );
    }
    
    // Filter by mentorship availability
    if (filtersApplied.mentorshipStatus) {
        filteredResults = filteredResults.filter(user => 
            user.availableForMentorship === true
        );
    }
    
    // Sort results
    sortResults(currentSort, filteredResults);
}

// Sort search results
function sortResults(sortOption, results = null) {
    currentSort = sortOption;
    
    const resultsToSort = results || [...searchResults];
    
    switch (sortOption) {
        case 'relevance':
            // Results are already sorted by relevance from the API
            break;
        
        case 'match-score':
            resultsToSort.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
            break;
        
        case 'name-asc':
            resultsToSort.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
            break;
        
        case 'name-desc':
            resultsToSort.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
            break;
        
        case 'batch-asc':
            resultsToSort.sort((a, b) => a.batch.localeCompare(b.batch));
            break;
        
        case 'batch-desc':
            resultsToSort.sort((a, b) => b.batch.localeCompare(a.batch));
            break;
    }
    
    // Render sorted results
    renderSearchResults(resultsToSort);
}

// Render search results
function renderSearchResults(results) {
    const searchResultsContainer = document.getElementById('search-results');
    
    if (!searchResultsContainer) return;
    
    if (results.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <p class="text-gray-600">No users found matching your search criteria.</p>
            </div>
        `;
        return;
    }
    
    searchResultsContainer.innerHTML = '';
    
    // Check current view type
    const isListView = searchResultsContainer.classList.contains('list-view');
    
    results.forEach(user => {
        const resultCard = document.createElement('div');
        resultCard.className = isListView 
            ? 'bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 flex items-center w-full mb-4' 
            : 'bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden';
        
        const matchScore = user.matchScore 
            ? `<div class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">${Math.round(user.matchScore * 100)}% Match</div>` 
            : '';
        
        const skillsList = user.skills && user.skills.length > 0 
            ? user.skills.slice(0, 3).map(skill => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${skill}</span>`).join(' ') 
            : '<span class="text-gray-500">No skills listed</span>';
        
        if (isListView) {
            resultCard.innerHTML = `
                <div class="flex-shrink-0 mr-4">
                    <img src="${user.profileImage || 'https://via.placeholder.com/50'}" alt="${user.firstName} ${user.lastName}" class="w-16 h-16 rounded-full object-cover">
                </div>
                <div class="flex-grow">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold">${user.firstName} ${user.lastName}</h3>
                            <p class="text-gray-600">${user.title || 'Student'}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            ${matchScore}
                            ${user.availableForMentorship ? '<div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Available as Mentor</div>' : ''}
                        </div>
                    </div>
                    <div class="mt-2">
                        <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Batch: ${user.batch}</span>
                        <span class="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">Branch: ${user.branch}</span>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                        ${skillsList}
                    </div>
                </div>
                <div class="flex-shrink-0 ml-4">
                    <a href="profile.html?id=${user._id}" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">View Profile</a>
                </div>
            `;
        } else {
            resultCard.innerHTML = `
                <div class="relative h-32 bg-indigo-100">
                    <div class="absolute top-4 right-4 flex flex-col space-y-1">
                        ${matchScore}
                        ${user.availableForMentorship ? '<div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Available as Mentor</div>' : ''}
                    </div>
                    <div class="absolute -bottom-8 left-4">
                        <img src="${user.profileImage || 'https://via.placeholder.com/80'}" alt="${user.firstName} ${user.lastName}" class="w-16 h-16 rounded-full object-cover border-2 border-white">
                    </div>
                </div>
                <div class="pt-10 p-4">
                    <h3 class="text-lg font-bold">${user.firstName} ${user.lastName}</h3>
                    <p class="text-gray-600">${user.title || 'Student'}</p>
                    <div class="mt-2">
                        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">Batch: ${user.batch}</span>
                        <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Branch: ${user.branch}</span>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                        ${skillsList}
                    </div>
                    <div class="mt-4">
                        <a href="profile.html?id=${user._id}" class="block text-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">View Profile</a>
                    </div>
                </div>
            `;
        }
        
        searchResultsContainer.appendChild(resultCard);
    });
    
    // Add load more button if there are more pages
    if (currentPage < totalPages) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'col-span-full flex justify-center mt-4 mb-8';
        loadMoreContainer.innerHTML = `
            <button id="load-more-btn" class="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition">
                Load More Results
            </button>
        `;
        searchResultsContainer.appendChild(loadMoreContainer);
        
        // Add event listener to load more button
        document.getElementById('load-more-btn').addEventListener('click', loadMoreResults);
    }
}

// Load more search results
async function loadMoreResults() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;
    }
    
    try {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();
        
        const response = await axios.get('/api/search/users', {
            params: {
                q: query,
                page: currentPage + 1,
                limit: 20
            }
        });
        
        // Add new results to existing results
        searchResults = [...searchResults, ...response.data.users];
        currentPage = response.data.page;
        totalPages = response.data.totalPages;
        
        // Apply filters and render
        applyFilters();
        
    } catch (error) {
        console.error('Error loading more results:', error);
        
        if (loadMoreBtn) {
            loadMoreBtn.textContent = 'Error. Try Again';
            loadMoreBtn.disabled = false;
        }
    }
}

// Clear all filters
function clearFilters() {
    // Uncheck all checkboxes
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset filters object
    filtersApplied = {
        batch: [],
        branch: [],
        skills: [],
        interests: [],
        mentorshipStatus: false
    };
    
    // Reset sort to default
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = 'relevance';
        currentSort = 'relevance';
    }
    
    // Re-render results
    renderSearchResults(searchResults);
}

// Update search statistics
function updateSearchStats(total) {
    const statsContainer = document.getElementById('search-stats');
    
    if (statsContainer) {
        const query = document.getElementById('search-input').value.trim();
        
        if (query) {
            statsContainer.textContent = `Found ${total} ${total === 1 ? 'user' : 'users'} matching "${query}"`;
        } else {
            statsContainer.textContent = `Showing all ${total} ${total === 1 ? 'user' : 'users'}`;
        }
    }
}
