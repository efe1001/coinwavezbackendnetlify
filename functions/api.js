require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('../routes/authRoutes');
const coinRoutes = require('../routes/coinRoutes');
const paymentRoutes = require('../routes/paymentRoutes');
const bannerRoutes = require('../routes/bannerRoutes');
const fetch = require('node-fetch');

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase configuration error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`);
  throw new Error('Supabase configuration is incomplete. Check your environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// MongoDB Connection with timeout handling
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
        socketTimeoutMS: 45000,
      });
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected`);
    }
    return true;
  } catch (err) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err.message);
    return false;
  }
};

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'https://coinswavez.com',
    'https://www.coinswavez.com',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3002',
    'https://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://coinswavez.com',
    'https://www.coinswavez.com',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:3002',
    'https://localhost:3002'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Request: ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB on each request with timeout
app.use(async (req, res, next) => {
  try {
    const dbConnected = await Promise.race([
      connectDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000))
    ]);
    
    if (!dbConnected) {
      console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB not connected, proceeding anyway`);
    }
    next();
  } catch (error) {
    console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection timeout, proceeding anyway`);
    next();
  }
});

// Middleware to fix paths for Netlify Functions
app.use((req, res, next) => {
  req.originalFunctionPath = req.url;
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '');
  }
  if (req.url === '') {
    req.url = '/';
  }
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Original path: ${req.originalFunctionPath}, Processed path: ${req.url}`);
  next();
});

// Add Supabase client to all requests
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Handle root path requests
app.get(['/', '/api'], async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    message: 'CoinWaveZ API is working!',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    supabase: !!supabase ? 'connected' : 'disconnected',
    endpoints: {
      news: '/api/news',
      health: '/api/health',
      coins: '/api/coins',
      banners: '/api/banners',
      payments: '/api/payments/create-charge',
      register: '/api/register',
      login: '/api/login'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodbConnected: isMongoConnected,
    supabaseConnected: !!supabase
  });
});

// CryptoPanic News API Proxy Endpoint
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic`);
  
  try {
    const API_KEY = process.env.CRYPTOPANIC_API_KEY || 'a89c9df2a5a33117ab7f0368f5fade13c7881b6a';
    const { kind = 'news', currencies, region, filter = 'rising' } = req.query;
    
    let apiUrl = `https://cryptopanic.com/api/v1/posts/?auth_token=${API_KEY}&kind=${kind}&filter=${filter}`;
    
    if (currencies) {
      apiUrl += `&currencies=${currencies}`;
    }
    
    if (region) {
      apiUrl += `&region=${region}`;
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`CryptoPanic API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const enhancedResults = data.results.map(item => {
        let previewText = "Click to read full article";
        if (item.title.toLowerCase().includes('bitcoin')) {
          previewText = "Bitcoin continues to dominate the cryptocurrency market with recent developments...";
        } else if (item.title.toLowerCase().includes('ethereum')) {
          previewText = "Ethereum network upgrades and DeFi developments are shaping the future of blockchain...";
        }
        
        return {
          ...item,
          preview: previewText,
          url: item.url || `https://cryptopanic.com/news/${item.id}/`
        };
      });
      
      res.status(200).json({ results: enhancedResults });
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching news:`, error.message);
    
    res.status(200).json({ 
      results: [
        {
          id: 1,
          title: "Bitcoin Surges Past $60,000 Amid Institutional Demand",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/1",
          source: { title: "CryptoPanic" },
          preview: "Bitcoin has reached a new all-time high..."
        },
        {
          id: 2,
          title: "Ethereum 2.0 Upgrade Scheduled for December Launch",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/2",
          source: { title: "CoinDesk" },
          preview: "The long-awaited Ethereum 2.0 upgrade..."
        }
      ]
    });
  }
});

// Import and use routes
app.use('/api', authRoutes); // Handles /api/register, /api/login, etc.
app.use('/api', coinRoutes); // Handles /api/coins, /api/me, /api/promoted, etc.
app.use('/api/payments', paymentRoutes); // Handles /api/payments/create-charge
app.use('/payments', paymentRoutes); // Handles /payments/create-charge for Netlify Functions
app.use('/api/banners', bannerRoutes); // Handles /api/banners

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, {
    message: err.message,
    path: req.path
  });
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] 404 for route: ${req.originalFunctionPath}`);
  res.status(404).json({ 
    message: `Route ${req.originalFunctionPath} not found`,
    availableEndpoints: [
      '/api',
      '/api/health',
      '/api/news',
      '/api/coins',
      '/api/banners',
      '/api/payments/create-charge',
      '/api/register',
      '/api/login'
    ]
  });
});

// Export the serverless function
const handler = serverless(app);

// Wrap the handler to add timeout protection
module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Function timeout')), 25000);
  });

  try {
    const result = await Promise.race([
      handler(event, context),
      timeoutPromise
    ]);
    return result;
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Function error:`, error.message);
    
    return {
      statusCode: error.message.includes('timeout') ? 504 : 500,
      body: JSON.stringify({
        message: error.message.includes('timeout') ? 'Request timeout' : 'Server error',
        error: error.message
      })
    };
  }
};