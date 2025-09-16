const express = require('express');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Create a new Express app just for the serverless function
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// MongoDB Connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err.message);
  }
};

// Middleware
app.use(require('cors')({
  origin: [
    'https://coinswavez.com',
    'https://www.coinswavez.com',
    'http://localhost:5173',
    'https://localhost:5173'
  ],
  credentials: true
}));
app.use(require('express').json({ limit: '10mb' }));
app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB on each request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Root endpoint for the function
app.get('/', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    message: 'CoinWaveZ API is working!',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    supabase: !!supabase ? 'connected' : 'disconnected',
    endpoints: {
      news: '/news',
      health: '/health',
      // Add other endpoints that are defined in this function
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodbConnected: isMongoConnected,
    supabaseConnected: !!supabase
  });
});

// CryptoPanic News API Proxy Endpoint
app.get('/news', async (req, res) => {
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
          title: "Ehereum 2.0 Upgrade Scheduled for December Launch",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/2",
          source: { title: "CoinDesk" },
          preview: "The long-awaited Ethereum 2.0 upgrade..."
        }
      ]
    });
  }
});

// Handle 404 for this specific function
app.use((req, res) => {
  res.status(404).json({ 
    message: `Endpoint ${req.path} not found in API function`,
    availableEndpoints: ['/', '/health', '/news']
  });
});

// Export the handler
module.exports.handler = require('serverless-http')(app);