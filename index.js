require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const fetch = require('node-fetch');
const serverless = require('serverless-http');

const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase configuration error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`);
  throw new Error('Supabase configuration is incomplete. Check your .env file.');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected`))
  .catch(err => console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err));

// Enhanced CORS configuration - Add this section
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://coinwavezfrontend.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://coinwavezbackend.netlify.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] CORS blocked origin:`, origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware - Update the CORS line
app.use(cors(corsOptions)); // Changed from app.use(cors()) to app.use(cors(corsOptions))
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Debug endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Serverless function is running', timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', coinRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/banners', bannerRoutes);

// CryptoPanic News API Proxy Endpoint - Add CORS headers specifically
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic`);
  
  // Set specific CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', 'https://coinwavezfrontend.netlify.app');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    const API_KEY = process.env.CRYPTO_PANIC_API_KEY || null;
    if (!API_KEY) {
      console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] CRYPTO_PANIC_API_KEY missing, returning fallback data`);
      throw new Error('Missing CRYPTO_PANIC_API_KEY');
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
        },
        {
          id: 3,
          title: "Solana Outage Highlights Blockchain Scalability Challenges",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/3",
          source: { title: "Decrypt" },
          preview: "The Solana network experienced a significant outage yesterday, raising questions about the scalability of high-throughput blockchains."
        },
        {
          id: 4,
          title: "NFT Market Sees Record Sales Despite Crypto Winter",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/4",
          source: { title: "The Block" },
          preview: "Non-fungible token sales have reached record levels this month, with several high-profile collections selling for millions."
        },
        {
          id: 5,
          title: "Central Banks Exploring CBDCs as Crypto Adoption Grows",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/5",
          source: { title: "Reuters" },
          preview: "Central banks worldwide are accelerating their research into central bank digital currencies (CBDCs) as cryptocurrency adoption grows."
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
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
  }
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports.handler = serverless(app);