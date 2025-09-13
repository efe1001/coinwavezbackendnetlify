const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Initialize lowdb
const dbPath = path.join(__dirname, '../db.json');
try {
  fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
} catch (err) {
  console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Creating db.json:`, err);
  fs.writeFileSync(dbPath, JSON.stringify({ admins: [], users: [], coins: [], promoted: [], banners: [] }, null, 2));
}
const adapter = new FileSync(dbPath);
const db = lowdb(adapter);

exports.submitCoin = async (req, res) => {
  try {
    const {
      name = '',
      symbol = '',
      description = '',
      categories = '[]',
      website = '',
      twitter = '',
      telegram = '',
      discord = '',
      contractAddress = '',
      chain = '',
      launchDate = '',
      marketCap = '',
      contactName = '',
      contactEmail = '',
      contactTelegram = '',
      price = '',
      totalSupply = '',
      circulatingSupply = '',
      whitepaper = '',
      auditLink = '',
      badges = '[]',
      team = '',
      presalePhase = '',
      youtubeLink = '',
      xLink = '',
      telegramLink = '',
      discordLink = '',
      watchlists = '0',
      votes = '0',
      dailyVotes = '0',
      dailyBoosts = '0',
      kycStatus = '',
      cap = '',
      volume = '',
      rank = '',
      createdAt = new Date().toISOString(),
      roadmap = ''
    } = req.body;
    const logo = req.file ? req.file.filename : null;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received coin submission data:`, {
      name, symbol, description, categories, website, twitter, telegram, discord,
      contractAddress, chain, launchDate, marketCap, contactName, contactEmail,
      contactTelegram, price, totalSupply, circulatingSupply, whitepaper, auditLink,
      badges, team, presalePhase, youtubeLink, xLink, telegramLink, discordLink,
      watchlists, votes, dailyVotes, dailyBoosts, kycStatus, cap, volume, rank,
      createdAt, roadmap, logo, fileDetails: req.file
    });

    let parsedCategories = [];
    let parsedBadges = [];
    try {
      parsedCategories = JSON.parse(categories || '[]');
      parsedBadges = JSON.parse(badges || '[]');
      if (!Array.isArray(parsedCategories) || !Array.isArray(parsedBadges)) {
        console.warn(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Categories or badges is not an array:`, { parsedCategories, parsedBadges });
        parsedCategories = Array.isArray(parsedCategories) ? parsedCategories : [];
        parsedBadges = Array.isArray(parsedBadges) ? parsedBadges : [];
      }
    } catch (parseError) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error parsing categories or badges:`, parseError);
      return res.status(400).json({ message: 'Invalid categories or badges format', error: parseError.message });
    }

    const newCoin = {
      id: Date.now().toString(),
      name, symbol, description, categories: parsedCategories, website, twitter, telegram, discord,
      contractAddress, chain, launchDate, marketCap, contactName, contactEmail, contactTelegram,
      price, totalSupply, circulatingSupply, whitepaper, auditLink, badges: parsedBadges,
      team, presalePhase, youtubeLink, xLink, telegramLink, discordLink,
      watchlists: parseInt(watchlists) || 0, votes: parseInt(votes) || 0,
      dailyVotes: parseInt(dailyVotes) || 0, dailyBoosts: parseInt(dailyBoosts) || 0,
      kycStatus, cap, volume, rank, createdAt, roadmap, logo, status: 'pending',
      boosts: parseInt(req.body.boosts) || 0
    };

    try {
      fs.accessSync(dbPath, fs.constants.W_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is writable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not writable:`, err);
      return res.status(500).json({ message: 'Database file is not writable', error: err.message });
    }

    try {
      db.get('coins').push(newCoin).write();
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin saved to db:`, newCoin);
    } catch (dbError) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error writing to db:`, dbError);
      return res.status(500).json({ message: 'Failed to save coin to database', error: dbError.message });
    }

    res.status(201).json({ message: 'Coin submitted successfully', coin: newCoin });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin submission error:`, {
      message: error.message, stack: error.stack, body: req.body, file: req.file
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const coins = db.get('coins').value(); // Return all coins, no status filter
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning all coins:`, coins);
    res.status(200).json(coins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const coins = db.get('coins').value();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning all coins:`, coins);
    res.status(200).json(coins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching all coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPendingCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const pendingCoins = db.get('coins').filter({ status: 'pending' }).value();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning pending coins:`, pendingCoins);
    res.status(200).json(pendingCoins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching pending coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.approveCoin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Approving coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    db.get('coins').find({ id }).assign({ status: 'approved' }).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin approved:`, id);
    res.status(200).json({ message: 'Coin approved successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error approving coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.rejectCoin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Rejecting coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    db.get('coins').find({ id }).assign({ status: 'rejected' }).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin rejected:`, id);
    res.status(200).json({ message: 'Coin rejected successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error rejecting coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.promoteCoin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Promoting coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    db.get('coins').find({ id }).assign({ status: 'promoted' }).write();
    db.get('promoted').push({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      logo: coin.logo,
      badges: coin.badges,
      cap: coin.cap,
      marketCap: coin.marketCap,
      price: coin.price,
      volume: coin.volume,
      launchDate: coin.launchDate,
      boosts: coin.boosts
    }).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin promoted:`, id);
    res.status(200).json({ message: 'Coin promoted successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error promoting coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unpromoteCoin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Unpromoting coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    db.get('coins').find({ id }).assign({ status: 'approved' }).write();
    db.set('promoted', db.get('promoted').filter((p) => p.id !== id).value()).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin unpromoted:`, id);
    res.status(200).json({ message: 'Coin unpromoted successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error unpromoting coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.editCoin = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Editing coin:`, id, updatedData);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    let parsedCategories = coin.categories;
    let parsedBadges = coin.badges;
    if (updatedData.categories) {
      try {
        parsedCategories = JSON.parse(updatedData.categories || '[]');
        if (!Array.isArray(parsedCategories)) parsedCategories = [];
      } catch (e) {
        parsedCategories = [];
      }
    }
    if (updatedData.badges) {
      try {
        parsedBadges = JSON.parse(updatedData.badges || '[]');
        if (!Array.isArray(parsedBadges)) parsedBadges = [];
      } catch (e) {
        parsedBadges = [];
      }
    }
    const updatedCoin = { ...coin, ...updatedData, categories: parsedCategories, badges: parsedBadges, logo: req.file ? req.file.filename : coin.logo };
    db.get('coins').find({ id }).assign(updatedCoin).write();
    if (coin.status === 'promoted') {
      db.get('promoted').find({ id }).assign({
        id: coin.id,
        name: updatedCoin.name,
        symbol: updatedCoin.symbol,
        logo: updatedCoin.logo,
        badges: updatedCoin.badges,
        cap: updatedCoin.cap,
        marketCap: updatedCoin.marketCap,
        price: updatedCoin.price,
        volume: updatedCoin.volume,
        launchDate: updatedCoin.launchDate,
        boosts: updatedCoin.boosts
      }).write();
    }
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin edited:`, id);
    res.status(200).json({ message: 'Coin edited successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error editing coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteCoin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Deleting coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    db.set('coins', db.get('coins').filter((c) => c.id !== id).value()).write();
    db.set('promoted', db.get('promoted').filter((p) => p.id !== id).value()).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin deleted:`, id);
    res.status(200).json({ message: 'Coin deleted successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error deleting coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCoinById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching coin:`, id);
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    res.status(200).json(coin);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching coin:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPromotedCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const promotedCoins = db.get('promoted').value();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning promoted coins:`, promotedCoins);
    res.status(200).json(promotedCoins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching promoted coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getNewCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const newCoins = db.get('coins')
      .sortBy('createdAt')
      .reverse()
      .value(); // Return all coins, no status filter
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning new coins:`, newCoins);
    res.status(200).json(newCoins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching new coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPresaleCoins = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const presaleCoins = db.get('coins')
      .filter((coin) => (coin.status === 'approved' || coin.status === 'promoted') && coin.presalePhase)
      .value();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning presale coins:`, presaleCoins);
    res.status(200).json(presaleCoins);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching presale coins:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadBanner = async (req, res) => {
  try {
    const banner = req.file ? req.file.filename : null;
    if (!banner) {
      return res.status(400).json({ message: 'No banner file provided' });
    }
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Uploading banner:`, banner);
    db.get('banners').push(banner).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Banner uploaded:`, banner);
    res.status(200).json({ message: 'Banner uploaded successfully', filename: banner });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error uploading banner:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Deleting banner:`, filename);
    const banner = db.get('banners').find((b) => b === filename).value();
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    db.set('banners', db.get('banners').filter((b) => b !== filename).value()).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Banner deleted:`, filename);
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error deleting banner:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBanners = async (req, res) => {
  try {
    try {
      fs.accessSync(dbPath, fs.constants.R_OK);
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is readable`);
    } catch (err) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] db.json is not readable:`, err);
      return res.status(500).json({ message: 'Database file is not readable', error: err.message });
    }

    const banners = db.get('banners').value();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning banners:`, banners);
    res.status(200).json(banners);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching banners:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.boostCoin = async (req, res) => {
  try {
    const { id } = req.params;
    const { coins: boostAmount } = req.body;
    const userId = req.user.id;
    
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Boosting coin:`, {
      coinId: id,
      userId,
      boostAmount
    });

    // Find the coin
    const coin = db.get('coins').find({ id }).value();
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }

    // Find the user
    const user = db.get('users').find({ id: userId }).value();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has enough coins
    if (user.coinCount < boostAmount) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    // Update user's coin count
    db.get('users')
      .find({ id: userId })
      .assign({ coinCount: user.coinCount - boostAmount })
      .write();

    // Update coin's boost count
    const currentBoosts = coin.boosts || 0;
    const currentDailyBoosts = coin.dailyBoosts || 0;
    
    db.get('coins')
      .find({ id })
      .assign({ 
        boosts: currentBoosts + boostAmount,
        dailyBoosts: currentDailyBoosts + boostAmount
      })
      .write();

    // If coin is promoted, update promoted coins as well
    if (coin.status === 'promoted') {
      const promotedCoin = db.get('promoted').find({ id }).value();
      if (promotedCoin) {
        db.get('promoted')
          .find({ id })
          .assign({ 
            boosts: (promotedCoin.boosts || 0) + boostAmount
          })
          .write();
      }
    }

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin boosted successfully:`, {
      coinId: id,
      newBoosts: currentBoosts + boostAmount,
      userRemainingCoins: user.coinCount - boostAmount
    });

    res.status(200).json({ 
      message: 'Coin boosted successfully',
      remainingCoins: user.coinCount - boostAmount,
      newBoostCount: currentBoosts + boostAmount
    });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error boosting coin:`, {
      message: error.message, 
      stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};