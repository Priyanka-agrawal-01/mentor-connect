// AI Matching Algorithm for MentorConnect

function generateAiMatches(preferences) {
    // Get all available users
    const users = window.mockUsers;
    
    // Filter for certified mentors only
    const certifiedMentors = users.filter(user => user.isCertifiedMentor && user.mentorField === preferences.field);
    
    // Calculate match scores for each certified mentor
    const matchedMentors = certifiedMentors.map(mentor => {
        const score = calculateMatchScore(mentor, preferences);
        return {
            ...mentor,
            matchScore: score
        };
    });
    
    // Sort mentors by match score
    const sortedMentors = matchedMentors
        .filter(mentor => mentor.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    
    // Update UI with matched mentors
    displayMatchedMentors(sortedMentors);
}

function calculateMatchScore(mentor, preferences) {
    let score = 0;
    const maxScore = 100;
    
    // Weight factors
    const weights = {
        skillLevel: 0.2,
        teachingStyle: 0.2,
        branches: 0.3,
        interests: 0.3
    };
    
    // Skill Level Match (20%)
    if (preferences.skillLevel === mentor.skillLevel) {
        score += weights.skillLevel * maxScore;
    } else if (
        (preferences.skillLevel === 'beginner' && mentor.skillLevel === 'intermediate') ||
        (preferences.skillLevel === 'intermediate' && mentor.skillLevel === 'advanced')
    ) {
        score += (weights.skillLevel * maxScore) * 0.5;
    }
    
    // Teaching Style Match (20%)
    if (preferences.learningStyle === mentor.teachingStyle) {
        score += weights.teachingStyle * maxScore;
    } else if (mentor.teachingStyle === 'mixed') {
        score += (weights.teachingStyle * maxScore) * 0.7;
    }
    
    // Technical Branches Match (30%)
    const branchMatchCount = preferences.branches.filter(branch => 
        mentor.branches.includes(branch)
    ).length;
    if (branchMatchCount > 0) {
        score += (weights.branches * maxScore) * (branchMatchCount / preferences.branches.length);
    }
    
    // Areas of Interest Match (30%)
    const interestMatchCount = preferences.interests.filter(interest => 
        mentor.interests.includes(interest)
    ).length;
    if (interestMatchCount > 0) {
        score += (weights.interests * maxScore) * (interestMatchCount / preferences.interests.length);
    }
    
    return Math.min(Math.max(score, 0), 100);
}

function displayMatchedMentors(matchedMentors) {
    const mentorsContent = document.getElementById('mentors-content');
    const mentorsGrid = mentorsContent.querySelector('.grid');
    
    if (mentorsGrid) {
        mentorsGrid.innerHTML = '';
        
        if (matchedMentors.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'col-span-full text-center py-8';
            noResults.innerHTML = `
                <p class="text-gray-500">No certified mentors found in your field.</p>
                <p class="text-sm text-gray-400 mt-2">Want to become a mentor? Take the certification exam between 7-9 PM.</p>
                <a href="mentor-exam.html" class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Take Mentor Exam
                </a>
            `;
            mentorsGrid.appendChild(noResults);
            return;
        }
        
        matchedMentors.forEach(mentor => {
            const mentorCard = createMentorCard(mentor);
            mentorsGrid.appendChild(mentorCard);
        });
    }
}

function createMentorCard(mentor) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow';
    
    const matchScoreClass = mentor.matchScore >= 80 ? 'bg-green-500' : 
                           mentor.matchScore >= 60 ? 'bg-blue-500' : 
                           'bg-gray-500';
    
    card.innerHTML = `
        <div class="p-6">
            <div class="flex items-center mb-4">
                <img src="${mentor.profileImage}" alt="${mentor.name}" class="w-14 h-14 rounded-full mr-4">
                <div>
                    <h3 class="font-semibold text-lg">${mentor.name}</h3>
                    <p class="text-gray-600">${mentor.title}</p>
                </div>
            </div>
            <div class="flex items-center text-sm text-yellow-500 mb-3">
                ${Array(5).fill('').map((_, i) => 
                    `<i class="fas fa-star${i < Math.floor(mentor.rating) ? '' : '-half-alt'}"></i>`
                ).join('')}
                <span class="ml-2 text-gray-600">${mentor.rating} (${mentor.totalMentees} mentees)</span>
            </div>
            <div class="mb-4">
                <h4 class="text-sm font-medium mb-2">Expertise</h4>
                <div class="flex flex-wrap gap-2">
                    ${mentor.branches.map(branch => 
                        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${branch}</span>`
                    ).join('')}
                </div>
            </div>
            <p class="text-gray-600 text-sm mb-4">${mentor.expertise}</p>
            <div class="flex justify-between items-center">
                <span class="text-green-600 text-sm font-medium">
                    <i class="fas fa-check-circle mr-1"></i>
                    Certified Mentor
                </span>
                <div class="space-x-2">
                    <button class="px-3 py-1 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50">Message</button>
                    <button class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Connect</button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateAiMatches, calculateMatchScore };
}
