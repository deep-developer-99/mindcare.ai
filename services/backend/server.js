const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins for development, but specify frontend URL in production
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5002',
      'http://127.0.0.1:5000',
      'https://localhost',
      'https://adorable-taiyaki-e8b484.netlify.app'
    ];

    // In production, check against actual frontend URL
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      // Development: allow all origins
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/assistant', assistantRoutes);

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
