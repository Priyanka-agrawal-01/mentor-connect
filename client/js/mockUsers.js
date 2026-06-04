// Mock Users Data
const mockUsers = [
    {
        id: "user1",
        email: "aditya.agarwal@example.com",
        password: "password123",
        firstName: "Aditya",
        lastName: "Agarwal",
        userType: "mentor",
        branch: "computer-science",
        batch: "2020",
        company: "Infosys",
        position: "Software Engineer",
        rating: 4.5,
        reviewCount: 24,
        skills: ["Full Stack", "Java", "React", "CSE"],
        interests: ["web-development", "system-design", "programming"],
        profileImage: "assets/profiles/aditya.jpg",
        status: "online",
        bio: "Full stack developer with expertise in React and Spring Boot. Passionate about mentoring students in web development and system design.",
        matchPercentage: 95,
        isCertifiedMentor: true,
        mentorField: 'web_development',
        examScore: 9,
        certificationDate: '2025-03-15',
        skillLevel: 'advanced',
        totalMentees: 15,
        expertise: 'Full Stack Development with 5 years of experience',
        teachingStyle: 'hands-on',
        branches: ['web_development', 'frontend', 'backend']
    },
    {
        id: "user2",
        email: "kishlaya.sinha@example.com",
        password: "password123",
        firstName: "Kishlaya",
        lastName: "Sinha",
        userType: "mentor",
        branch: "computer-science",
        batch: "2022",
        company: "TCS",
        position: "Data Scientist",
        rating: 5.0,
        reviewCount: 17,
        skills: ["Machine Learning", "Python", "Data Science", "CSE"],
        interests: ["ai", "machine-learning", "data-science", "nlp"],
        profileImage: "assets/profiles/kishlaya.jpg",
        status: "away",
        bio: "Specializes in machine learning algorithms and natural language processing. Helping students transition into AI and data science careers.",
        matchPercentage: 87,
        isCertifiedMentor: true,
        mentorField: 'data_science',
        examScore: 8,
        certificationDate: '2025-03-20',
        skillLevel: 'advanced',
        totalMentees: 12,
        expertise: 'Data Science and Machine Learning',
        teachingStyle: 'project-based',
        branches: ['data_science', 'machine_learning', 'nlp']
    },
    {
        id: "user3",
        email: "priyaka.agrawal@example.com",
        password: "password123",
        firstName: "Priyaka",
        lastName: "Agrawal",
        userType: "mentor",
        branch: "information-technology",
        batch: "2022",
        company: "Wipro",
        position: "UI/UX Designer",
        rating: 4.0,
        reviewCount: 15,
        skills: ["UI/UX", "Figma", "Web Design", "IT"],
        interests: ["ui-ux", "design", "web-design", "user-experience"],
        profileImage: "assets/profiles/priyaka.jpg",
        status: "online",
        bio: "Experienced UI/UX designer focused on creating intuitive user experiences. Helps students build impressive design portfolios for job applications.",
        matchPercentage: 84,
        isCertifiedMentor: true,
        mentorField: 'ui_ux',
        examScore: 8.5,
        certificationDate: '2025-03-25',
        skillLevel: 'intermediate',
        totalMentees: 10,
        expertise: 'UI/UX Design and Web Development',
        teachingStyle: 'hands-on',
        branches: ['ui_ux', 'web_development', 'frontend']
    },
    {
        id: "user4",
        email: "vanshika.lakra@example.com",
        password: "password123",
        firstName: "Vanshika",
        lastName: "Lakra",
        userType: "mentor",
        branch: "electronics",
        batch: "2023",
        company: "Tech Mahindra",
        position: "Systems Engineer",
        rating: 4.5,
        reviewCount: 12,
        skills: ["IoT", "Embedded Systems", "C++", "ECE"],
        interests: ["iot", "embedded-systems", "hardware-design", "electronics"],
        profileImage: "assets/profiles/vanshika.jpg",
        status: "offline",
        bio: "Specializes in embedded systems and IoT device development. Guides ECE students in building practical hardware projects and preparing for interviews.",
        matchPercentage: 82,
        isCertifiedMentor: true,
        mentorField: 'embedded_systems',
        examScore: 9.5,
        certificationDate: '2025-03-10',
        skillLevel: 'advanced',
        totalMentees: 8,
        expertise: 'Embedded Systems and IoT Development',
        teachingStyle: 'project-based',
        branches: ['embedded_systems', 'iot', 'ece']
    },
    {
        id: "user5",
        email: "akshat.bhagat@example.com",
        password: "password123",
        firstName: "Akshat",
        lastName: "Bhagat",
        userType: "mentor",
        branch: "ai-ml",
        batch: "2024",
        company: "Cognizant",
        position: "AI Engineer",
        rating: 4.0,
        reviewCount: 8,
        skills: ["Deep Learning", "Computer Vision", "TensorFlow", "AIML"],
        interests: ["ai", "deep-learning", "computer-vision", "machine-learning"],
        profileImage: "assets/profiles/akshat.jpg",
        status: "online",
        bio: "Recent graduate specializing in AI and computer vision. Mentors students in building deep learning projects and shares industry insights from Cognizant.",
        matchPercentage: 79,
        isCertifiedMentor: true,
        mentorField: 'ai',
        examScore: 9,
        certificationDate: '2025-03-15',
        skillLevel: 'advanced',
        totalMentees: 5,
        expertise: 'AI and Computer Vision',
        teachingStyle: 'hands-on',
        branches: ['ai', 'deep_learning', 'computer_vision']
    }
];

// Mock Users by Email
const mockUsersByEmail = mockUsers.reduce((acc, user) => {
    acc[user.email] = user;
    return acc;
}, {});

// Mock Conversations
const mockConversations = [
    {
        id: "conv1",
        participants: ["user1", "student1"],
        messages: [
            {
                id: "msg1",
                sender: "student1",
                text: "Hi Aditya, I'm interested in learning more about React and Spring Boot. Do you have any recommendations for beginners?",
                timestamp: new Date(2025, 2, 24, 14, 30)
            },
            {
                id: "msg2",
                sender: "user1",
                text: "Hello! I'd recommend starting with the official React documentation and then trying to build a small project. For Spring Boot, the Spring Initializr is a great way to get started with a new project.",
                timestamp: new Date(2025, 2, 24, 14, 35)
            },
            {
                id: "msg3",
                sender: "student1",
                text: "That's helpful! Do you think it's better to learn React or Angular for a beginner?",
                timestamp: new Date(2025, 2, 24, 14, 40)
            }
        ]
    },
    {
        id: "conv2",
        participants: ["user2", "student2"],
        messages: [
            {
                id: "msg1",
                sender: "student2",
                text: "Hello Kishlaya, I'm working on a machine learning project for my final year and facing issues with model accuracy. Could you guide me?",
                timestamp: new Date(2025, 2, 23, 10, 15)
            },
            {
                id: "msg2",
                sender: "user2",
                text: "Hi there! I'd be happy to help. Could you share more details about your dataset and what algorithms you've tried so far?",
                timestamp: new Date(2025, 2, 23, 11, 20)
            }
        ]
    },
    {
        id: "conv3",
        participants: ["user3", "student3"],
        messages: [
            {
                id: "msg1",
                sender: "student3",
                text: "Hi Priyaka, I'm building my UX portfolio for internship applications. Would you be willing to review it?",
                timestamp: new Date(2025, 2, 22, 9, 10)
            },
            {
                id: "msg2",
                sender: "user3",
                text: "Hello! I'd be happy to review your portfolio. Please share it with me, and I'll provide feedback on how to improve it for internship applications.",
                timestamp: new Date(2025, 2, 22, 9, 45)
            }
        ]
    },
    {
        id: "conv4",
        participants: ["user4", "student4"],
        messages: [
            {
                id: "msg1",
                sender: "student4",
                text: "Hello Vanshika, I'm an ECE student working on an IoT project using Arduino. I'm having trouble with sensor integration. Can you help?",
                timestamp: new Date(2025, 2, 25, 13, 0)
            },
            {
                id: "msg2",
                sender: "user4",
                text: "Hi! I'd be glad to help with your Arduino project. What sensors are you using, and what specific issues are you facing with the integration?",
                timestamp: new Date(2025, 2, 25, 13, 10)
            }
        ]
    },
    {
        id: "conv5",
        participants: ["user5", "student5"],
        messages: [
            {
                id: "msg1",
                sender: "student5",
                text: "Hi Akshat, I'm interested in computer vision and would like to start a project. Do you have any suggestions for beginners?",
                timestamp: new Date(2025, 2, 20, 16, 30)
            },
            {
                id: "msg2",
                sender: "user5",
                text: "Hello! For beginners in computer vision, I recommend starting with OpenCV and a simple project like face detection or object tracking. Would you like more specific project ideas?",
                timestamp: new Date(2025, 2, 20, 17, 0)
            }
        ]
    }
];

// Mock Students
const mockStudents = [
    {
        id: "student1",
        firstName: "Raj",
        lastName: "Mehta",
        profileImage: "assets/profiles/student1.jpg",
        isCertifiedMentor: false,
        skillLevel: 'intermediate',
        interests: ['web_development', 'ui_design'],
        branches: ['frontend']
    },
    {
        id: "student2",
        firstName: "Ananya",
        lastName: "Verma",
        profileImage: "assets/profiles/student2.jpg",
        isCertifiedMentor: false,
        skillLevel: 'beginner',
        interests: ['mobile_development', 'android'],
        branches: ['mobile_dev']
    },
    {
        id: "student3",
        firstName: "Karan",
        lastName: "Malhotra",
        profileImage: "assets/profiles/student3.jpg",
        isCertifiedMentor: false,
        skillLevel: 'intermediate',
        interests: ['data_science', 'machine_learning'],
        branches: ['data_science']
    },
    {
        id: "student4",
        firstName: "Divya",
        lastName: "Singh",
        profileImage: "assets/profiles/student4.jpg",
        isCertifiedMentor: false,
        skillLevel: 'beginner',
        interests: ['iot', 'embedded_systems'],
        branches: ['embedded_systems']
    },
    {
        id: "student5",
        firstName: "Rohan",
        lastName: "Gupta",
        profileImage: "assets/profiles/student5.jpg",
        isCertifiedMentor: false,
        skillLevel: 'intermediate',
        interests: ['ai', 'deep_learning'],
        branches: ['ai']
    }
];

// Mock Communities
const mockCommunities = [
    {
        id: "comm1",
        name: "AI & ML Enthusiasts",
        description: "A community for students and mentors interested in artificial intelligence and machine learning.",
        type: "interest",
        interests: ["ai", "data-science", "deep-learning"],
        members: ["user2", "user5"],
        createdAt: new Date(2024, 9, 15)
    },
    {
        id: "comm2",
        name: "Web & Mobile Developers",
        description: "For everyone passionate about web and mobile app development.",
        type: "interest",
        interests: ["web-development", "mobile-development", "ui-ux"],
        members: ["user1", "user3"],
        createdAt: new Date(2024, 10, 3)
    },
    {
        id: "comm3",
        name: "Computer Science - 2022 Batch",
        description: "Official community for CS students and mentors from the 2022 batch.",
        type: "batch",
        branch: "computer-science",
        batch: "2022",
        members: ["user2"],
        createdAt: new Date(2025, 0, 10)
    },
    {
        id: "comm4",
        name: "Electronics & IoT",
        description: "Discuss electronics projects, IoT innovations, and embedded systems.",
        type: "interest",
        interests: ["iot", "embedded-systems", "electronics"],
        members: ["user4"],
        createdAt: new Date(2025, 1, 5)
    },
    {
        id: "comm5",
        name: "UI/UX Design Hub",
        description: "For designers and developers interested in creating beautiful and functional user interfaces.",
        type: "interest",
        interests: ["ui-ux", "design", "user-experience"],
        members: ["user3"],
        createdAt: new Date(2024, 8, 20)
    }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mockUsers, mockUsersByEmail, mockStudents, mockConversations, mockCommunities };
} else {
    window.mockUsers = mockUsers;
    window.mockUsersByEmail = mockUsersByEmail;
    window.mockStudents = mockStudents;
    window.mockConversations = mockConversations;
    window.mockCommunities = mockCommunities;
}
