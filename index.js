require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const fetch = require('node-fetch');

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
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connected`);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] MongoDB connection error:`, err);
  }
};

// Middleware - Updated CORS to include all possible frontend URLs
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
  credentials: true
}));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Connect to MongoDB on each request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Create a wrapper function to handle both route formats
const createDualRouteHandler = (handler) => {
  return (req, res, next) => {
    // Store original URL for logging
    req.originalApiPath = req.path;
    
    // If this is a serverless request, modify the path to remove the function prefix
    if (req.path.startsWith('/.netlify/functions/api')) {
      req.url = req.url.replace('/.netlify/functions/api', '');
    }
    
    return handler(req, res, next);
  };
};

// Apply the dual route handler to all routes
app.use(['/api', '/.netlify/functions/api'], createDualRouteHandler(authRoutes));
app.use(['/api', '/.netlify/functions/api'], createDualRouteHandler(coinRoutes));
app.use(['/api/payments', '/.netlify/functions/api/payments'], createDualRouteHandler(paymentRoutes));
app.use(['/api/banners', '/.netlify/functions/api/banners'], createDualRouteHandler(bannerRoutes));

// CryptoPanic News API Proxy Endpoint - Support both paths
const newsHandler = async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic for path: ${req.originalApiPath}`);
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
};

app.get(['/api/news', '/.netlify/functions/api/news'], newsHandler);

// Health check endpoint - Support both paths
const healthHandler = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodbConnected: mongoose.connection.readyState === 1,
    supabaseConnected: !!supabase,
    requestPath: req.originalApiPath,
    processedPath: req.path
  });
};

app.get(['/api/health', '/.netlify/functions/api/health'], healthHandler);

// Root endpoint - Support both paths
const rootHandler = (req, res) => {
  res.status(200).json({ 
    message: 'CoinWaveZ API is working!',
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    requestPath: req.originalApiPath,
    endpoints: {
      news: '/api/news (or /.netlify/functions/api/news)',
      health: '/api/health (or /.netlify/functions/api/health)',
      coins: '/api/coins (or /.netlify/functions/api/coins)',
      banners: '/api/banners (or /.netlify/functions/api/banners)',
      payments: '/api/payments (or /.netlify/functions/api/payments)'
    }
  });
};

app.get(['/api', '/.netlify/functions/api'], rootHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    originalPath: req.originalApiPath
  });
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404
app.use((req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] 404 for route: ${req.originalApiPath} (processed: ${req.path})`);
  res.status(404).json({ 
    message: `Route ${req.originalApiPath} not found`,
    originalPath: req.originalApiPath,
    processedPath: req.path
  });
});

// Export the serverless function
module.exports.handler = serverless(app);

// Start server for local development (optional)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server running on http://localhost:${PORT}`);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] API endpoints available at:`);
    console.log(`- http://localhost:${PORT}/api`);
    console.log(`- http://localhost:${PORT}/.netlify/functions/api`);
  }).on('error', (err) => {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server startup error:`, err);
  });
}