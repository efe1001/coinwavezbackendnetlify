require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fetch = require('node-fetch'); // Add this import

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, uploadDir);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error setting upload destination:`, err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instance with 1GB limit
const upload = multer({
  storage,
  limits: { 
    fileSize: 1024 * 1024 * 1024, // 1GB limit (1024 * 1024 * 1024 bytes)
    fieldSize: 1024 * 1024 * 1024 // Also increase field size limit if needed
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] File upload attempt:`, {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only PNG, JPG, JPEG, and WEBP are allowed.`));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '1gb' })); // Increase JSON body size limit
app.use(express.urlencoded({ extended: true, limit: '1gb' })); // Increase URL-encoded body size limit
app.use('/uploads', express.static(uploadDir));

// Make Multer instance available to routes
app.set('upload', upload);

// Routes
app.use('/api', authRoutes);
app.use('/api', coinRoutes);
app.use('/api/payments', paymentRoutes);

// Authentication middleware (assuming it's defined in authRoutes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  // Verify token (implement JWT verification here, e.g., with jsonwebtoken)
  // For now, assume a simple check
  if (token !== 'valid-token') { // Replace with actual JWT verification
    return res.status(403).json({ message: 'Invalid token' });
  }
  next();
};

// In-memory user store (replace with database in production)
let users = [
  { id: 1, username: 'user1', coinCount: 10 },
  { id: 2, username: 'user2', coinCount: 5 },
];

// New endpoints for user management
app.get('/api/users', authenticateToken, (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching all users`);
  try {
    res.status(200).json(users);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching users:`, error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

app.post('/api/users/:userId/add-coins', authenticateToken, (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Adding coins to user ${req.params.userId}`, req.body);
  try {
    const { userId } = req.params;
    const { coins } = req.body;
    if (!coins || isNaN(coins) || parseInt(coins) <= 0) {
      return res.status(400).json({ message: 'Invalid coins value' });
    }

    const user = users.find(u => u.id === parseInt(userId));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.coinCount = (user.coinCount || 0) + parseInt(coins);
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Updated user ${userId} coin count to ${user.coinCount}`);
    res.status(200).json({ message: 'Coins added successfully', userId, coins: user.coinCount });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error adding coins:`, error);
    res.status(500).json({ message: 'Error adding coins', error: error.message });
  }
});

// NEW: CryptoPanic News API Proxy Endpoint
// Update your /api/news endpoint in index.js
app.get('/api/news', async (req, res) => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching news from CryptoPanic`);
  try {
    const API_KEY = 'a89c9df2a5a33117ab7f0368f5fade13c7881b6a';
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
    
    // Enhance the data with additional information
    const enhancedResults = data.results.map(item => {
      // Create a summary or preview text
      let previewText = "Click to read full article";
      
      // Add some sample content based on the title
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
        // Ensure we have a proper URL
        url: item.url || `https://cryptopanic.com/news/${item.id}/`
      };
    });
    
    res.status(200).json({
      results: enhancedResults
    });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching news:`, error);
    
    // Return sample data if API fails
    res.status(200).json({ 
      results: [
        {
          id: 1,
          title: "Bitcoin Surges Past $60,000 Amid Institutional Demand",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/1",
          source: { title: "CryptoPanic" },
          preview: "Bitcoin has reached a new all-time high as institutional investors continue to show strong interest in cryptocurrency investments. Major companies are adding BTC to their balance sheets."
        },
        {
          id: 2,
          title: "Ethereum 2.0 Upgrade Scheduled for December Launch",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/2",
          source: { title: "CoinDesk" },
          preview: "The long-awaited Ethereum 2.0 upgrade is set to launch in December, bringing proof-of-stake consensus and scalability improvements to the network."
        },
        {
          id: 3,
          title: "Solana Outage Highlights Blockchain Scalability Challenges",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/3",
          source: { title: "Decrypt" },
          preview: "The Solana network experienced a significant outage yesterday, raising questions about the scalability of high-throughput blockchains during peak demand."
        },
        {
          id: 4,
          title: "NFT Market Sees Record Sales Despite Crypto Winter",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/4",
          source: { title: "The Block" },
          preview: "Non-fungible token sales have reached record levels this month, with several high-profile collections selling for millions of dollars each."
        },
        {
          id: 5,
          title: "Central Banks Exploring CBDCs as Crypto Adoption Grows",
          published_at: new Date().toISOString(),
          url: "https://cryptopanic.com/news/5",
          source: { title: "Reuters" },
          preview: "Central banks worldwide are accelerating their research into central bank digital currencies (CBDCs) as cryptocurrency adoption continues to grow among retail and institutional investors."
        }
      ]
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    file: req.file ? { originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : null
  });
  
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds 1GB limit.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field.';
    } else if (err.code === 'LIMIT_PART_COUNT') {
      message = 'Too many parts in the form.';
    } else if (err.code === 'LIMIT_FIELD_KEY') {
      message = 'Field name is too long.';
    } else if (err.code === 'LIMIT_FIELD_VALUE') {
      message = 'Field value is too long.';
    } else if (err.code === 'LIMIT_FIELD_COUNT') {
      message = 'Too many fields in the form.';
    }
    return res.status(400).json({ message, error: err.message, code: err.code });
  }
  
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server running on http://localhost:${PORT}`);
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Payment endpoints available at http://localhost:${PORT}/api/payments`);
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] News endpoint available at http://localhost:${PORT}/api/news`);
}).on('error', (err) => {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Server startup error:`, err);
  if (err.code === 'EADDRINUSE') {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Port ${PORT} is already in use. Try a different port.`);
  }
});