const express = require('express');
const axios = require('axios');
const router = express.Router();
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs'); // Use synchronous fs methods
const crypto = require('crypto');
require('dotenv').config();

const API_KEY = process.env.COINBASE_API_KEY;
const WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coinbase Commerce API Key:`, 
  API_KEY ? `${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}` : 'NOT SET'
);
console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coinbase Webhook Secret:`, 
  WEBHOOK_SECRET ? 'SET' : 'NOT SET'
);

// Validate environment variables
if (!API_KEY) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] COINBASE_API_KEY is not set. Payment processing will fail.`);
}
if (!WEBHOOK_SECRET) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] COINBASE_WEBHOOK_SECRET is not set. Webhook processing will fail.`);
}

// Initialize LowDB
const dbPath = path.join(__dirname, '../db.json');
try {
  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json exists and is accessible`);
} catch (err) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Creating db.json:`, err.message);
  fs.writeFileSync(dbPath, JSON.stringify({ admins: [], users: [], coins: [], promoted: [], banners: [], transactions: [] }, null, 2));
  console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json created successfully`);
}
const adapter = new FileSync(dbPath);
const db = lowdb(adapter);

// Ensure transactions array exists
db.defaults({ transactions: [] }).write();

router.post('/create-charge', async (req, res) => {
  try {
    const { name, description, amount, currency, metadata } = req.body;

    // Validate required fields
    if (!name || !description || !amount || !currency || !metadata?.crypto || !metadata?.userId || !metadata?.coinCount) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Missing required fields:`, {
        name: !!name, description: !!description, amount: !!amount, currency: !!currency,
        crypto: !!metadata?.crypto, userId: !!metadata?.userId, coinCount: !!metadata?.coinCount
      });
      return res.status(400).json({ 
        error: 'Missing required fields: name, description, amount, currency, crypto, userId, or coinCount in metadata' 
      });
    }

    // Validate coinCount is a positive integer
    const coinCount = parseInt(metadata.coinCount);
    if (isNaN(coinCount) || coinCount <= 0) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Invalid coinCount:`, metadata.coinCount);
      return res.status(400).json({ error: 'coinCount must be a positive integer' });
    }

    // Verify user exists
    const user = db.get('users').find({ id: metadata.userId }).value();
    if (!user) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User not found:`, metadata.userId);
      return res.status(400).json({ error: `User with ID ${metadata.userId} not found` });
    }

    // Generate a unique transaction ID
    const transactionId = crypto.randomUUID();

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Creating charge:`, {
      name, description, amount, currency, metadata, transactionId
    });

    if (!API_KEY) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coinbase Commerce API key not configured`);
      return res.status(500).json({ 
        error: 'Payment system not configured properly. API key missing.' 
      });
    }

    // Determine base URL for redirects
    const baseUrl = process.env.APP_BASE_URL || req.headers.origin || 'http://localhost:3000';

    const response = await axios.post(
      'https://api.commerce.coinbase.com/charges',
      {
        name,
        description,
        local_price: {
          amount: amount.toString(),
          currency
        },
        pricing_type: 'fixed_price',
        supported_networks: [metadata.crypto.toUpperCase()],
        metadata: {
          userId: metadata.userId,
          coinCount: coinCount.toString(),
          transactionId
        },
        redirect_url: `${baseUrl}/boost/success`,
        cancel_url: `${baseUrl}/boost/cancel`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': API_KEY,
          'X-CC-Version': '2018-03-22',
        },
        timeout: 15000,
      }
    );

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Charge created successfully:`, {
      chargeId: response.data.data.id,
      hostedUrl: response.data.data.hosted_url,
      metadata: response.data.data.metadata
    });

    // Store pending transaction
    db.get('transactions').push({
      id: transactionId,
      chargeId: response.data.data.id,
      userId: metadata.userId,
      coinCount,
      status: 'pending',
      createdAt: new Date().toISOString()
    }).write();

    res.json(response.data.data);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Charge creation error:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      code: error.code
    });

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The Coinbase Commerce API key is invalid or has been revoked. Please ensure you’re using the full secret key.',
        details: error.response?.data || 'No additional details'
      });
    } else if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Your server IP might not be whitelisted. Check Commerce dashboard.',
        details: error.response?.data
      });
    } else if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Gateway timeout',
        message: 'Request timed out. Check network.'
      });
    } else if (error.request) {
      return res.status(503).json({
        error: 'Payment gateway unavailable',
        message: 'No response from payment service.'
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!WEBHOOK_SECRET) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Webhook secret not configured`);
      return res.status(500).json({ error: 'Webhook secret not configured. Please set COINBASE_WEBHOOK_SECRET in .env.' });
    }

    const rawBody = req.body;
    const signature = req.headers['x-cc-webhook-signature'];

    // Verify webhook signature
    const computedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== signature) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Invalid webhook signature`, {
        received: signature,
        computed: computedSignature
      });
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString());
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Webhook received:`, {
      type: event.type,
      id: event.id,
      chargeId: event.data?.id,
      metadata: event.data?.metadata
    });

    switch (event.type) {
      case 'charge:confirmed':
        const { userId, coinCount, transactionId } = event.data.metadata;
        if (!userId || !coinCount || !transactionId) {
          console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Missing userId, coinCount, or transactionId in metadata`, event.data.metadata);
          return res.status(400).json({ error: 'Missing userId, coinCount, or transactionId in metadata' });
        }

        const parsedCoinCount = parseInt(coinCount);
        if (isNaN(parsedCoinCount) || parsedCoinCount <= 0) {
          console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Invalid coinCount:`, coinCount);
          return res.status(400).json({ error: 'coinCount must be a positive integer' });
        }

        const user = db.get('users').find({ id: userId }).value();
        if (!user) {
          console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User not found for ID:`, userId);
          return res.status(400).json({ error: `User with ID ${userId} not found` });
        }

        // Check if transaction was already processed
        const transaction = db.get('transactions').find({ id: transactionId }).value();
        if (transaction && transaction.status === 'confirmed') {
          console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Transaction ${transactionId} already processed`);
          return res.status(200).json({ message: 'Transaction already processed' });
        }

        // Retry logic for database update
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            const newCoinCount = (user.coinCount || 0) + parsedCoinCount;
            db.get('users').find({ id: userId }).assign({ coinCount: newCoinCount }).write();
            db.get('transactions').find({ id: transactionId }).assign({ status: 'confirmed', updatedAt: new Date().toISOString() }).write();
            console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Updated user ${userId} coinCount to ${newCoinCount}, transaction ${transactionId} marked as confirmed`);
            break;
          } catch (error) {
            attempts++;
            console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Database update attempt ${attempts} failed:`, error.message);
            if (attempts === maxAttempts) {
              console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Max database update attempts reached for transaction ${transactionId}`);
              return res.status(500).json({ error: 'Failed to update database after multiple attempts' });
            }
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
          }
        }
        break;
      case 'charge:failed':
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Charge failed:`, event.data);
        if (event.data.metadata?.transactionId) {
          db.get('transactions').find({ id: event.data.metadata.transactionId }).assign({ status: 'failed', updatedAt: new Date().toISOString() }).write();
        }
        break;
      case 'charge:delayed':
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Charge delayed:`, event.data);
        if (event.data.metadata?.transactionId) {
          db.get('transactions').find({ id: event.data.metadata.transactionId }).assign({ status: 'delayed', updatedAt: new Date().toISOString() }).write();
        }
        break;
      default:
        console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Unhandled event type:`, event.type);
    }

    res.status(200).json({ message: 'Webhook received and processed' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Webhook error:`, {
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

router.get('/charge/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!API_KEY) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coinbase Commerce API key not configured`);
      return res.status(500).json({ 
        error: 'Payment system not configured properly' 
      });
    }

    const response = await axios.get(
      `https://api.commerce.coinbase.com/charges/${id}`,
      {
        headers: {
          'X-CC-Api-Key': API_KEY,
          'X-CC-Version': '2018-03-22',
        },
        timeout: 15000,
      }
    );

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Retrieved charge:`, {
      chargeId: response.data.data.id,
      status: response.data.data.timeline.map(t => `${t.status} at ${t.time}`).join(', '),
      metadata: response.data.data.metadata
    });

    res.json(response.data.data);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Get charge error:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'Failed to get charge details',
        details: error.response.data 
      });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }),
    apiKeyConfigured: !!API_KEY,
    webhookSecretConfigured: !!WEBHOOK_SECRET
  });
});

module.exports = router;

