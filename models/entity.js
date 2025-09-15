const mongoose = require('mongoose');

// User Schema and Model
const userSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coinCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'users'
});

// Admin Schema and Model
const adminSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'admins'
});

// Coin Schema and Model
const coinSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  symbol: String,
  description: String,
  categories: [String],
  website: String,
  twitter: String,
  telegram: String,
  discord: String,
  contractAddress: String,
  chain: String,
  launchDate: String,
  marketCap: String,
  contactName: String,
  contactEmail: String,
  contactTelegram: String,
  price: String,
  totalSupply: String,
  circulatingSupply: String,
  whitepaper: String,
  auditLink: String,
  badges: [String],
  team: String,
  presalePhase: String,
  youtubeLink: String,
  xLink: String,
  telegramLink: String,
  discordLink: String,
  watchlists: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  dailyVotes: { type: Number, default: 0 },
  dailyBoosts: { type: Number, default: 0 },
  kycStatus: String,
  cap: String,
  volume: String,
  rank: String,
  roadmap: String,
  logo: String,
  status: { type: String, default: 'pending' },
  boosts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'coins'
});

// Promoted Schema and Model
const promotedSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  name: String,
  symbol: String,
  logo: String,
  badges: [String],
  cap: String,
  marketCap: String,
  price: String,
  volume: String,
  launchDate: String,
  boosts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'promoted'
});

// Banner Schema and Model
const bannerSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  filename: String,
  image: String,
  position: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'banners'
});

// Transaction Schema and Model
const transactionSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  chargeId: String,
  userId: String,
  coinCount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}, { 
  timestamps: true,
  collection: 'transactions'
});

// Aggregate models into Entity object
const Entity = {
  User: mongoose.model('User', userSchema),
  Admin: mongoose.model('Admin', adminSchema),
  Coin: mongoose.model('Coin', coinSchema),
  Promoted: mongoose.model('Promoted', promotedSchema),
  Banner: mongoose.model('Banner', bannerSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};

module.exports = Entity;
