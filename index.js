require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();


const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase;
let supabaseConnected = false;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseConnected = true;
  console.log('Supabase connected successfully');
}

// Add to middleware
app.use((req, res, next) => {
  if (supabase) {
    req.supabase = supabase;
  }
  next();
});


const mongoose = require('mongoose');

// MongoDB Connection
let mongodbConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      mongodbConnected = true;
      console.log('MongoDB connected successfully');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
    });
}

// Middleware
app.use(cors({
  origin: ['https://coinwavezfrontend.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log('Request received: ' + req.method + ' ' + req.url);
  next();
});

// Debug endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
  });
});

// Basic routes
app.post('/api/register', (req, res) => {
  res.json({ message: 'Register endpoint', success: true });
});

app.post('/api/login', (req, res) => {
  res.json({ message: 'Login endpoint', success: true, token: 'mock-jwt-token' });
});

app.get('/api/coins', (req, res) => {
  res.json({ 
    message: 'Coins endpoint', 
    coins: [
      { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 50000 },
      { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3000 }
    ] 
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

module.exports = app;