const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../apps/frontend')));

// Fallback to main frontend page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../apps/frontend/Him2.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
