require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const serverless = require('serverless-http');

// Import routes
const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

// Debug environment variables
console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] SUPABASE_URL:`, process.env.SUPABASE_URL ? "Present" : "Missing");
console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MONGODB_URI:`, process.env.MONGODB_URI ? "Present" : "Missing");
console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] CRYPTO_PANIC_API_KEY:`, process.env.CRYPTO_PANIC_API_KEY ? "Present" : "Missing");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase;
let supabaseConnected = false;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseConnected = true;
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase connected successfully`);
} else {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase configuration error: Missing SUPABASE_URL or SUPABASE_ANON_KEY`);
}

// MongoDB Connection
let mongodbConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      mongodbConnected = true;
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected successfully`);
    })
    .catch(err => {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err.message);
    });
} else {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB URI is missing`);
}

// Middleware
app.use(cors({
  origin: ['https://coinwavezfrontend.netlify.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Attach supabase client to req
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Request received: ${req.method} ${req.url}`);
  if (supabase) {
    req.supabase = supabase;
  }
  next();
});

// Debug endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    connections: {
      mongodb: mongodbConnected ? "Connected" : "Not connected",
      supabase: supabaseConnected ? "Connected" : "Not connected"
    }
  });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', coinRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', bannerRoutes);

// CryptoPanic News API Proxy Endpoint
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] /api/news request received`);
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
    
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching from CryptoPanic:`, apiUrl);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] CryptoPanic API error: ${response.status} ${response.statusText}`);
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
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching news:`, error.message);
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
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] /api/health request received`);
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    connections: {
      mongodb: mongodbConnected ? "Connected" : "Not connected",
      supabase: supabaseConnected ? "Connected" : "Not connected"
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, {
    message: err.message,
    path: req.path
  });
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Export for both serverless and standalone server
const handler = serverless(app);

// For Netlify Functions
module.exports.handler = async (event, context) => {
  return await handler(event, context);
};

// For standalone server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;