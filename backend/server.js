const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

const USE_MOCK_DATA = String(process.env.USE_MOCK_DATA || 'true').toLowerCase() === 'true';

// Connect to database when not running in mock mode
if (USE_MOCK_DATA) {
  console.log('⚠️  Mock mode enabled - Database connection skipped');
} else {
  connectDB().catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Server error', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
