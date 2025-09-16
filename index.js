require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coinwavez', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected`);
}).catch(err => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err.message);
});

// Middleware
app.use(cors({
  origin: [
    'https://coinswavez.com',
    'https://www.coinswavez.com',
    'http://localhost:5173',
    'https://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/api', async (req, res) => {
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
      payments: '/api/payments'
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

// CryptoPanic News API Proxy Endpoint with timeout
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
    
    // Add timeout to external API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
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
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching news:`, error.message);
    
    // Return fallback data quickly
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] 404 for route: ${req.path}`);
  res.status(404).json({ message: `Route ${req.path} not found` });
});

// Export the serverless function
module.exports.handler = serverless(app);

// Start server for local development only if not in Lambda environment
if (process.env.NODE_ENV !== 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server running on http://localhost:${PORT}`);
  });
}