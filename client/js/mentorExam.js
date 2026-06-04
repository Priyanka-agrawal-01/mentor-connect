const mentorExam = {
    currentQuestion: 0,
    totalQuestions: 10,
    timeLimit: 45 * 60, // 45 minutes in seconds
    timeLeft: 45 * 60,
    timer: null,
    answers: Array(10).fill(''),
    flaggedQuestions: [],
    isSubmitting: false,
    webDevQuestions: [
        {
            id: 1,
            question: "Explain the difference between synchronous and asynchronous programming in JavaScript.",
            type: "essay",
            weight: 10,
            maxWords: 300
        },
        {
            id: 2,
            question: "Describe the concept of closures in JavaScript and provide an example.",
            type: "essay",
            weight: 10,
            maxWords: 250
        },
        {
            id: 3,
            question: "Explain the difference between a class and a prototype in JavaScript.",
            type: "essay",
            weight: 10,
            maxWords: 300
        },
        {
            id: 4,
            question: "What is the event loop in JavaScript and how does it work?", 
            type: "essay",
            weight: 10,
            maxWords: 350
        },
        {
            id: 5,
            question: "Describe the concept of virtual DOM in React and its benefits.",
            type: "essay",
            weight: 10,
            maxWords: 300
        },
        {
            id: 6,
            question: "Explain RESTful API design principles and provide an example.",
            type: "essay",
            weight: 10,
            maxWords: 400
        },
        {
            id: 7,
            question: "What are the key differences between SQL and NoSQL databases?",
            type: "essay",
            weight: 10,
            maxWords: 350
        },
        {
            id: 8,
            question: "Explain the concept of dependency injection and its benefits.",
            type: "essay",
            weight: 10,
            maxWords: 300
        },
        {
            id: 9,
            question: "Describe the SOLID principles and provide an example for each.",
            type: "essay",
            weight: 10,
            maxWords: 500
        },
        {
            id: 10,
            question: "What are the key considerations when designing a scalable web application?",
            type: "essay",
            weight: 10,
            maxWords: 400
        }
    ],

    startTimer: function() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    },
    
    updateTimerDisplay: function() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    },
    
    timeUp: function() {
        clearInterval(this.timer);
        alert('Time\'s up! Your exam will be submitted automatically.');
        this.submitExam(this.answers);
    },
    
    submitExam: async function(answers) {
        if (this.isSubmitting) {
            return null;
        }

        this.isSubmitting = true;

        try {
            // Show loading state
            const submitBtn = document.getElementById('submit-exam-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }

            const payload = {
                answers: answers.map((answer, index) => ({
                    questionId: this.webDevQuestions[index].id,
                    answer: answer,
                    question: this.webDevQuestions[index].question
                })),
                examType: 'web-development',
                timeSpent: (45 * 60) - this.timeLeft
            };

            if (window.location.port === '3000') {
                const score = this.calculateScore(answers);
                const result = {
                    success: true,
                    ...score,
                    submittedAt: new Date().toISOString(),
                    payload
                };
                sessionStorage.setItem('examResult', JSON.stringify(result));
                localStorage.removeItem('mentorExamProgress');
                return result;
            }

            const response = await fetch('/api/submit-mentor-exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Store the result and redirect to results page
            sessionStorage.setItem('examResult', JSON.stringify(result));
            window.location.href = 'exam-results.html';
            
            return result;
        } catch (error) {
            console.error('Error submitting exam:', error);
            // Show error message to user
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.textContent = 'Failed to submit the exam. Please check your connection and try again.';
                errorMessage.classList.remove('hidden');
            }
            
            const submitBtn = document.getElementById('submit-exam-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Exam';
            }
            this.isSubmitting = false;
            
            throw error;
        }
    },

    calculateScore: function(answers) {
        let totalScore = 0;
        let totalPossible = 0;
        
        answers.forEach((answer, index) => {
            if (answer && answer.trim()) {
                const question = this.webDevQuestions[index];
                const words = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
                const wordScore = Math.min((words / question.maxWords) * 100, 100);
                
                // Apply question weight (all questions have equal weight in this case)
                const questionScore = (wordScore * question.weight) / 100;
                totalScore += questionScore;
            }
            totalPossible += this.webDevQuestions[index].weight;
        });
        
        // Calculate percentage score
        const percentageScore = Math.round((totalScore / totalPossible) * 100);
        
        // Determine pass/fail (passing score is 70%)
        const passed = percentageScore >= 70;
        
        return {
            score: percentageScore,
            passed: passed,
            totalPossible: totalPossible,
            totalEarned: Math.round(totalScore)
        };
    },
    
    // Navigation functions
    nextQuestion: function() {
        if (this.currentQuestion < this.totalQuestions - 1) {
            this.saveAnswer(this.currentQuestion);
            this.currentQuestion++;
            this.showQuestion(this.currentQuestion);
        } else if (this.currentQuestion === this.totalQuestions - 1) {
            // This is the last question, submit the exam
            this.saveAnswer(this.currentQuestion);
            if (confirm('Are you sure you want to submit the exam?')) {
                this.submitExam(this.answers);
            }
        }
    },
    
    previousQuestion: function() {
        if (this.currentQuestion > 0) {
            this.saveAnswer(this.currentQuestion);
            this.currentQuestion--;
            this.showQuestion(this.currentQuestion);
        }
    },
    
    saveAnswer: function(questionIndex) {
        const answerTextarea = document.getElementById(`answer-${questionIndex}`);
        if (answerTextarea) {
            this.answers[questionIndex] = answerTextarea.value;
        }
    },
    
    showQuestion: function(questionIndex) {
        // Update progress bar
        const progress = ((questionIndex + 1) / this.totalQuestions) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('question-counter').textContent = `Question ${questionIndex + 1} of ${this.totalQuestions}`;
        
        // Update navigation buttons
        document.getElementById('prev-btn').disabled = questionIndex === 0;
        document.getElementById('next-btn').textContent = questionIndex === this.totalQuestions - 1 ? 'Submit' : 'Next';
        
        // Show current question
        const question = this.webDevQuestions[questionIndex];
        const questionContainer = document.getElementById('current-question');
        
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div>
                    <h3 class="text-lg font-medium text-gray-900 mb-4">${question.question}</h3>
                    <div class="mt-4">
                        <label for="answer-${questionIndex}" class="block text-sm font-medium text-gray-700 mb-2">
                            Your Answer (Max ${question.maxWords} words)
                        </label>
                        <textarea 
                            id="answer-${questionIndex}" 
                            rows="8" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type your answer here..."
                        >${this.answers[questionIndex] || ''}</textarea>
                        <p class="mt-1 text-sm text-gray-500">
                            Word count: <span id="word-count-${questionIndex}">
                                ${this.answers[questionIndex] ? this.answers[questionIndex].split(/\s+/).filter(word => word.length > 0).length : 0}
                            </span> / ${question.maxWords}
                        </p>
                    </div>
                </div>
            `;
            
            // Add event listener for word count
            const textarea = document.getElementById(`answer-${questionIndex}`);
            if (textarea) {
                textarea.addEventListener('input', (e) => {
                    const words = e.target.value.split(/\s+/).filter(word => word.length > 0);
                    document.getElementById(`word-count-${questionIndex}`).textContent = words.length;
                    
                    // Warn if approaching word limit
                    const wordCountElement = document.getElementById(`word-count-${questionIndex}`);
                    if (words.length > question.maxWords * 0.9) {
                        wordCountElement.classList.add('text-red-600', 'font-medium');
                    } else {
                        wordCountElement.classList.remove('text-red-600', 'font-medium');
                    }
                });
            }
        }
        
        // Update question navigator
        this.updateQuestionNavigator(questionIndex);
    },
    
    updateQuestionNavigator: function(currentIndex) {
        const navigator = document.getElementById('question-navigator');
        if (!navigator) return;
        
        navigator.innerHTML = '';
        
        this.webDevQuestions.forEach((_, index) => {
            const button = document.createElement('button');
            button.textContent = index + 1;
            button.className = `w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                index === currentIndex 
                    ? 'bg-blue-600 text-white' 
                    : this.answers[index] 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`;
            
            if (this.flaggedQuestions.includes(index)) {
                button.innerHTML += ' <i class="fas fa-flag text-yellow-500 text-xs"></i>';
            }
            
            button.addEventListener('click', () => {
                this.saveAnswer(this.currentQuestion);
                this.currentQuestion = index;
                this.showQuestion(index);
            });
            
            navigator.appendChild(button);
        });
    },
    
    toggleFlagQuestion: function() {
        const questionIndex = this.currentQuestion;
        const flagIndex = this.flaggedQuestions.indexOf(questionIndex);
        
        if (flagIndex === -1) {
            this.flaggedQuestions.push(questionIndex);
        } else {
            this.flaggedQuestions.splice(flagIndex, 1);
        }
        
        this.updateQuestionNavigator(questionIndex);
        
        // Update flag button state
        const flagButton = document.getElementById('flag-btn');
        if (flagButton) {
            if (flagIndex === -1) {
                flagButton.classList.add('bg-yellow-50', 'border-yellow-500');
                flagButton.innerHTML = '<i class="fas fa-flag text-yellow-600 mr-2"></i> Flagged for Review';
            } else {
                flagButton.classList.remove('bg-yellow-50', 'border-yellow-500');
                flagButton.innerHTML = '<i class="far fa-flag text-gray-500 mr-2"></i> Flag for Review';
            }
        }
    },
    
    saveProgress: function() {
        try {
            const progress = {
                answers: this.answers,
                currentQuestion: this.currentQuestion,
                flaggedQuestions: this.flaggedQuestions,
                timeLeft: this.timeLeft,
                lastSaved: new Date().toISOString()
            };
            
            localStorage.setItem('mentorExamProgress', JSON.stringify(progress));
            
            // Show save confirmation
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Saved!';
                
                setTimeout(() => {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            alert('Failed to save progress. Please try again.');
        }
    },
    
    loadProgress: function() {
        try {
            const savedProgress = localStorage.getItem('mentorExamProgress');
            if (savedProgress) {
                const progress = JSON.parse(savedProgress);
                this.answers = progress.answers || [];
                this.currentQuestion = progress.currentQuestion || 0;
                this.flaggedQuestions = progress.flaggedQuestions || [];
                this.timeLeft = progress.timeLeft || (45 * 60);
                
                // Update UI
                this.showQuestion(this.currentQuestion);
                this.updateTimerDisplay();
                
                // Restore flag button state if current question is flagged
                if (this.flaggedQuestions.includes(this.currentQuestion)) {
                    const flagButton = document.getElementById('flag-btn');
                    if (flagButton) {
                        flagButton.classList.add('bg-yellow-50', 'border-yellow-500');
                        flagButton.innerHTML = '<i class="fas fa-flag text-yellow-600 mr-2"></i> Flagged for Review';
                    }
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
        return false;
    },
    
    // Initialize the exam
    init: function() {
        // Load saved progress or start new exam
        const hasSavedProgress = this.loadProgress();
        
        // If no saved progress, show first question
        if (!hasSavedProgress) {
            this.showQuestion(0);
        }
        
        // Start the timer
        this.startTimer();
        
        // Set up event listeners
        document.getElementById('next-btn')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('flag-btn')?.addEventListener('click', () => this.toggleFlagQuestion());
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveProgress());
        
        // Handle beforeunload to warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.answers.some(answer => answer.trim() !== '')) {
                e.preventDefault();
                e.returnValue = 'You have unsaved exam progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }
};
