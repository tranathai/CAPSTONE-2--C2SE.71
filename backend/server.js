const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/mysql');
const { sequelize } = require('./models');

// Load environment variables
dotenv.config();

// Connect to MySQL database
connectDB();

// Automatically sync models with database (DISABLED temporarily - tables already exist)
// sequelize.sync({ logging: console.log, force: false }).then(() => {
//   console.log('Sequelize models synced with MySQL');
// }).catch((err) => {
//   console.error('Sequelize sync error:', err.message);
//   console.error('Full error:', err);
//   process.exit(1);
// });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

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
