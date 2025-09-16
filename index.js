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
const PORT = process.env.PORT || 3002;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase = null;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase configuration error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`);
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase initialized successfully`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase initialization error:`, error.message);
  }
}

// MongoDB Connection with status tracking
let mongoConnected = false;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    mongoConnected = true;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected successfully`);
  })
  .catch(err => {
    mongoConnected = false;
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err.message);
  });

// Middleware
app.use(cors());
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', coinRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/banners', bannerRoutes);

// Root endpoint with connection status
app.get('/', (req, res) => {
  const status = {
    message: mongoConnected ? 'MongoDB connected successfully' : 'MongoDB not connected',
    mongodb: mongoConnected ? 'connected' : 'not connected',
    supabase: supabase ? 'configured' : 'not configured',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
  };
  res.status(200).json(status);
});

// CryptoPanic News API Proxy Endpoint
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic`);
  try {
    const API_KEY = process.env.CRYPTO_PANIC_API_KEY || 'a89c9df2a5a33117ab7f0368f5fade13c7881b6a';
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
  const netlify = process.env.NETLIFY ? 'Yes' : 'No';
  const functionRegion = process.env.AWS_REGION || 'Unknown';
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodbConnected: mongoConnected,
    supabaseConnected: !!supabase,
    environment: process.env.NODE_ENV || 'development',
    runningOnNetlify: netlify,
    region: functionRegion,
    requestHeaders: req.headers
  });
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint not found. Use /api/* for available routes.",
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })
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

// Export for Netlify Functions
module.exports.handler = serverless(app);

// Start server only when running locally
if (process.env.NETLIFY_DEV !== 'true') {
  app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server running on http://localhost:${PORT}`);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB status: ${mongoConnected ? 'CONNECTED' : 'NOT CONNECTED'}`);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Payment endpoints available at http://localhost:${PORT}/api/payments`);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] News endpoint available at http://localhost:${PORT}/api/news`);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Banner endpoints available at http://localhost:${PORT}/api/banners`);
  }).on('error', (err) => {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server startup error:`, err);
    if (err.code === 'EADDRINUSE') {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Port ${PORT} is already in use. Try a different port.`);
    }
  });
}