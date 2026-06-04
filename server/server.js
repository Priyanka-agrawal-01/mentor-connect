// MentorConnect - Main Server File
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./utils/database');
const createSocketServer = require('./socket');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mentorshipRoutes = require('./routes/mentorships');
const messageRoutes = require('./routes/messages');
const goalRoutes = require('./routes/goals');
const badgeRoutes = require('./routes/badges');
const communityRoutes = require('./routes/communities');
const searchRoutes = require('./routes/search');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS options
const corsOptions = {
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB
connectDB()
  .then(() => console.log('MongoDB connection established'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Socket.io with explicit logging
console.log('Initializing Socket.io server...');
const io = createSocketServer(server);
console.log('Socket.io server initialized');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mentorships', mentorshipRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MentorConnect API is running' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
    });
} else {
    app.use(express.static(path.join(__dirname, '../client')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };
