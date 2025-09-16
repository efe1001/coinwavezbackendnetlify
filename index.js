require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase configuration warning: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`);
}
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Validate JWT_SECRET
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_1234567890') {
  console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] JWT_SECRET is missing or using default placeholder; /api/login may not work`);
}

// Connect to MongoDB once at startup
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGODB_URI) {
        console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MONGODB_URI is missing; MongoDB features will be disabled`);
        return;
      }
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected successfully`);
    }
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, error);
  }
};
connectDB().catch((error) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Failed to connect to MongoDB:`, error);
});

// Middleware
app.use(cors({ origin: ['https://coinswavez.com', 'https://www.coinswavez.com'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple test route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'CoinWaveZ API is working!',
    baseUrl: process.env.APP_BASE_URL || 'https://coinwavezbackend.netlify.app',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    supabase: supabase ? 'connected' : 'disconnected',
    endpoints: {
      news: '/api/news',
      health: '/api/health',
      coins: '/api/coins',
      banners: '/api/banners',
      register: '/api/register',
      login: '/api/login',
      payments: '/api/payments/create'
    }
  });
});

// Auth routes
app.post('/api/register', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ message: 'Supabase is not configured; registration unavailable' });
  }
  // Placeholder: Implement user registration with Supabase or MongoDB
  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_1234567890') {
    return res.status(503).json({ message: 'Authentication is not configured; please contact support' });
  }
  // Placeholder: Implement actual user authentication
  const token = jwt.sign({ userId: 'sample_user_id' }, jwtSecret, { expiresIn: '1h' });
  res.status(200).json({ message: 'User logged in successfully', token });
});

// Coin routes
app.get('/api/coins', async (req, res) => {
  const coinbaseApiKey = process.env.COINBASE_API_KEY;
  if (coinbaseApiKey && coinbaseApiKey !== 'your_coinbase_api_key') {
    // Placeholder: Fetch coin prices from Coinbase
    try {
      // Example: Uncomment to integrate Coinbase API
      // const response = await fetch('https://api.coinbase.com/v2/prices/spot', {
      //   headers: { Authorization: `Bearer ${coinbaseApiKey}` }
      // });
      // const data = await response.json();
      // return res.status(200).json(data);
      res.status(200).json([
        { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 50000 },
        { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3000 }
      ]);
    } catch (error) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coinbase API error:`, error);
      res.status(200).json([
        { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 50000 },
        { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3000 }
      ]);
    }
  } else {
    console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] COINBASE_API_KEY is missing or using default placeholder`);
    res.status(200).json([
      { id: 1, name: 'Bitcoin', symbol: 'BTC', price: 50000 },
      { id: 2, name: 'Ethereum', symbol: 'ETH', price: 3000 }
    ]);
  }
});

// Payment routes
app.post('/api/payments/create', (req, res) => {
  const coinbaseWebhookSecret = process.env.COINBASE_WEBHOOK_SECRET;
  if (!coinbaseWebhookSecret || coinbaseWebhookSecret === 'your_coinbase_webhook_secret') {
    console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] COINBASE_WEBHOOK_SECRET is missing or using default placeholder`);
  }
  // Placeholder: Use COINBASE_WEBHOOK_SECRET for payment verification
  res.status(201).json({ 
    message: 'Payment created successfully',
    paymentId: 'pay_' + Math.random().toString(36).substr(2, 9)
  });
});

// Banner routes
app.get('/api/banners', (req, res) => {
  res.status(200).json([
    { id: 1, title: 'Welcome Bonus', image: 'https://example.com/banner1.jpg' },
    { id: 2, title: 'Special Offer', image: 'https://example.com/banner2.jpg' }
  ]);
});

// CryptoPanic News API Proxy Endpoint
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic`);
  try {
    const API_KEY = process.env.CRYPTOPANIC_API_KEY;
    if (!API_KEY || API_KEY === 'your_cryptopanic_api_key') {
      throw new Error('CryptoPanic API key is missing or using default placeholder');
    }
    const { kind = 'news', currencies, region, filter = 'rising' } = req.query;
    
    let apiUrl = `https://cryptopanic.com/api/v1/posts/?auth_token=${API_KEY}&kind=${kind}&filter=${filter}`;
    
    if (currencies) {
      apiUrl += `&currencies=${currencies}`;
    }
    
    if (region) {
      apiUrl += `&region=${region}`;
    }
    
    const response = await fetch(apiUrl);
    
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
      } else if (item.title.toLowerCase().includes('nft')) {
        previewText = "The NFT market is evolving with new projects and partnerships emerging regularly...";
      } else if (item.title.toLowerCase().includes('defi')) {
        previewText = "DeFi protocols are introducing innovative solutions for decentralized finance...";
      }
      
      return {
        ...item,
        preview: previewText,
        url: item.url || `https://cryptopanic.com/news/${item.id}/`
      };
    });
    
    res.status(200).json({ results: enhancedResults });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching news:`, error);
    res.status(200).json({ 
      results: [
        {
          id: 1,
          title: "Bitcoin Surges Past $60,000 Amid Institutional Demand",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/1",
          source: { title: "CryptoPanic" },
          preview: "Bitcoin has reached a new all-time high as institutional investors continue to show strong interest in cryptocurrency investments."
        },
        {
          id: 2,
          title: "Ethereum 2.0 Upgrade Scheduled for December Launch",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/2",
          source: { title: "CoinDesk" },
          preview: "The long-awaited Ethereum 2.0 upgrade is set to launch in December, bringing proof-of-stake consensus and scalability improvements."
        }
      ]
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodbConnected: mongoose.connection.readyState === 1,
    supabaseConnected: !!supabase
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` });
});

// Export the serverless function
module.exports.handler = serverless(app);