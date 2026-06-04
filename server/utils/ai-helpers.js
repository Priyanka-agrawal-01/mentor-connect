// AI Helper Functions for MentorConnect
// These functions would typically use ML models or external AI APIs
// For prototype purposes, we'll use simplified rule-based implementations

/**
 * Calculates matching score between student and mentor
 * @param {Object} student - Student user object
 * @param {Object} mentor - Mentor user object
 * @returns {Number} - Matching score (0-100)
 */
function calculateMatchScore(student, mentor) {
    let score = 0;
    let maxScore = 0;
    
    // Skills matching (50% weight)
    if (student.skills && student.skills.length && mentor.skills && mentor.skills.length) {
        const studentSkills = new Set(student.skills.map(s => s.toLowerCase()));
        const mentorSkills = new Set(mentor.skills.map(s => s.toLowerCase()));
        
        let matchCount = 0;
        studentSkills.forEach(skill => {
            if (mentorSkills.has(skill)) matchCount++;
        });
        
        const skillScore = (matchCount / Math.max(studentSkills.size, 1)) * 50;
        score += skillScore;
        maxScore += 50;
    }
    
    // Interests matching (30% weight)
    if (student.interests && student.interests.length && mentor.interests && mentor.interests.length) {
        const studentInterests = new Set(student.interests.map(i => i.toLowerCase()));
        const mentorInterests = new Set(mentor.interests.map(i => i.toLowerCase()));
        
        let matchCount = 0;
        studentInterests.forEach(interest => {
            if (mentorInterests.has(interest)) matchCount++;
        });
        
        const interestScore = (matchCount / Math.max(studentInterests.size, 1)) * 30;
        score += interestScore;
        maxScore += 30;
    }
    
    // Career goals matching (20% weight)
    if (student.careerGoals && student.careerGoals.length && mentor.careerGoals && mentor.careerGoals.length) {
        const studentGoals = new Set(student.careerGoals.map(g => g.toLowerCase()));
        const mentorGoals = new Set(mentor.careerGoals.map(g => g.toLowerCase()));
        
        let matchCount = 0;
        studentGoals.forEach(goal => {
            if (mentorGoals.has(goal)) matchCount++;
        });
        
        const goalScore = (matchCount / Math.max(studentGoals.size, 1)) * 20;
        score += goalScore;
        maxScore += 20;
    }
    
    // Normalize score if maxScore is not 100
    if (maxScore > 0 && maxScore !== 100) {
        score = (score / maxScore) * 100;
    }
    
    return Math.round(score);
}

/**
 * AI-powered mentor matching
 * @param {Object} student - Student user
 * @param {Array} mentors - Array of potential mentors
 * @returns {Array} - Sorted array of mentors with match scores
 */
async function matchUserWithMentors(student, mentors) {
    // Calculate match score for each mentor
    const matchedMentors = mentors.map(mentor => {
        const matchScore = calculateMatchScore(student, mentor);
        return {
            ...mentor.toObject(),
            matchScore
        };
    });
    
    // Sort by match score (highest first)
    return matchedMentors.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * AI spam detection for messages
 * @param {String} message - Message content to check
 * @returns {Boolean} - True if message is spam/inappropriate
 */
async function spamDetection(message) {
    // In a real app, this would use NLP to detect spam/inappropriate content
    // For prototype, we'll use simple keyword detection
    
    const spamKeywords = [
        'viagra', 'cialis', 'casino', 'lottery', 'prize', 'winner', 
        'free money', 'buy now', 'limited time', 'click here',
        'porn', 'sex', 'xxx', 'nude', 'naked'
    ];
    
    const messageLower = message.toLowerCase();
    
    return spamKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * AI document verification
 * @param {String} documentUrl - URL to document image
 * @returns {Object} - Verification result
 */
async function verifyDocument(documentUrl) {
    // In a real app, this would use computer vision to verify documents
    // For prototype, we'll return a placeholder result
    
    return {
        verified: true,
        confidence: 0.92,
        documentType: 'degree',
        institution: 'Sample University',
        year: '2022'
    };
}

/**
 * AI chatbot response generation
 * @param {String} query - User's question
 * @param {Object} userData - User's profile data for context
 * @returns {String} - AI generated response
 */
async function generateAIChatResponse(query, userData) {
    // In a real app, this would use an LLM like GPT to generate responses
    // For prototype, we'll use template responses
    
    const responses = [
        "That's a great question! Based on your interests in ${userData.interests[0]}, I'd recommend exploring opportunities in that field.",
        "Let me help you with that. Looking at your skills in ${userData.skills[0]}, you might want to consider connecting with mentors who specialize in this area.",
        "I can definitely assist with this. Given your career goals related to ${userData.careerGoals[0]}, here's what I suggest...",
        "Good question! Many students ask about this. The best approach would be to start with small projects related to your interest in ${userData.interests[0]}.",
        "Based on your profile, I think you'd benefit from working on your ${userData.skills[0]} skills further. This is highly valued in today's job market."
    ];
    
    // Select a random response template
    const template = responses[Math.floor(Math.random() * responses.length)];
    
    // Fill in template with user data
    let response = template;
    
    // Replace user data placeholders if they exist
    if (userData.interests && userData.interests.length > 0) {
        response = response.replace('${userData.interests[0]}', userData.interests[0]);
    }
    
    if (userData.skills && userData.skills.length > 0) {
        response = response.replace('${userData.skills[0]}', userData.skills[0]);
    }
    
    if (userData.careerGoals && userData.careerGoals.length > 0) {
        response = response.replace('${userData.careerGoals[0]}', userData.careerGoals[0]);
    }
    
    return response;
}

/**
 * Calculate user engagement score
 * @param {Object} user - User object with activity data
 * @returns {Number} - Engagement score (0-100)
 */
async function calculateEngagementScore(user) {
    // In a real app, this would use a more complex algorithm
    // based on multiple activities and engagement patterns
    
    let score = 0;
    
    // Active mentor connections
    if (user.mentors && user.mentors.length > 0) {
        score += Math.min(user.mentors.length * 10, 30);
    }
    
    // Message activity
    if (user.messageCount) {
        score += Math.min(user.messageCount / 10, 30);
    }
    
    // Goals progress
    if (user.goals && user.goals.length > 0) {
        const totalGoals = user.goals.length;
        const completedGoals = user.goals.filter(goal => goal.isCompleted).length;
        const progressScore = (completedGoals / totalGoals) * 20;
        score += progressScore;
    }
    
    // Login frequency
    if (user.loginCount) {
        score += Math.min(user.loginCount / 7, 20);
    }
    
    return Math.round(score);
}

module.exports = {
    matchUserWithMentors,
    spamDetection,
    verifyDocument,
    generateAIChatResponse,
    calculateEngagementScore
};
