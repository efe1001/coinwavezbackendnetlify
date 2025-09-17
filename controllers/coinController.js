const Entity = require('../models/entity');

exports.submitCoin = async (req, res) => {
  try {
    const supabase = req.supabase; // Use the Supabase client from req
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
      roadmap = '',
      logoUrl
    } = req.body;

    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received coin submission data:`, {
      name, symbol, description, categories, website, twitter, telegram, discord,
      contractAddress, chain, launchDate, marketCap, contactName, contactEmail,
      contactTelegram, price, totalSupply, circulatingSupply, whitepaper, auditLink,
      badges, team, presalePhase, youtubeLink, xLink, telegramLink, discordLink,
      watchlists, votes, dailyVotes, dailyBoosts, kycStatus, cap, volume, rank,
      createdAt, roadmap, logo: logoUrl
    });

   let logoPath = null;
if (req.file) {
  // Upload the file to Supabase
  const fileExt = req.file.originalname.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('coin-logos')
    .upload(fileName, req.file.buffer, {
      cacheControl: '3600',
      upsert: false,
    });
  if (uploadError) {
    throw new Error(`Failed to upload logo: ${uploadError.message}`);
  }
  logoPath = fileName;
} else if (req.body.logoUrl) {
  // Use the existing logoUrl
  logoPath = req.body.logoUrl;
}

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

    const newCoin = new Entity.Coin({
      name, symbol, description, categories: parsedCategories, website, twitter, telegram, discord,
      contractAddress, chain, launchDate, marketCap, contactName, contactEmail, contactTelegram,
      price, totalSupply, circulatingSupply, whitepaper, auditLink, badges: parsedBadges,
      team, presalePhase, youtubeLink, xLink, telegramLink, discordLink,
      watchlists: parseInt(watchlists) || 0, votes: parseInt(votes) || 0,
      dailyVotes: parseInt(dailyVotes) || 0, dailyBoosts: parseInt(dailyBoosts) || 0,
      kycStatus, cap, volume, rank, createdAt, roadmap, logo: logoPath, status: 'pending',
      boosts: parseInt(req.body.boosts) || 0
    });

    await newCoin.save();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin saved to db:`, newCoin);

    res.status(201).json({ message: 'Coin submitted successfully', coin: newCoin });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Coin submission error:`, {
      message: error.message, stack: error.stack, body: req.body
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCoins = async (req, res) => {
  try {
    const coins = await Entity.Coin.find();
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
    const coins = await Entity.Coin.find();
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
    const pendingCoins = await Entity.Coin.find({ status: 'pending' });
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
    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    await Entity.Coin.updateOne({ id }, { status: 'approved' });
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
    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    await Entity.Coin.updateOne({ id }, { status: 'rejected' });
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
    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    await Entity.Coin.updateOne({ id }, { status: 'promoted' });
    const newPromoted = new Entity.Promoted({
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
    });
    await newPromoted.save();
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
    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    await Entity.Coin.updateOne({ id }, { status: 'approved' });
    await Entity.Promoted.deleteOne({ id });
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
    const supabase = req.supabase; // Use the Supabase client from req
    const { id } = req.params;
    const updatedData = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Editing coin:`, id, updatedData);
    const coin = await Entity.Coin.findOne({ id });
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
    let logoPath = coin.logo;
    if (updatedData.logoUrl) {
      console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Logo file received for edit:`, updatedData.logoUrl);
      const { data: fileData, error: fileError } = await supabase.storage
        .from('coin-logos')
        .list('', { search: updatedData.logoUrl });

      if (fileError) {
        console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase file check error:`, fileError);
        return res.status(500).json({ message: 'Error verifying logo file', error: fileError.message });
      }

      if (!fileData.find(file => file.name === updatedData.logoUrl)) {
        console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Logo file not found in Supabase:`, updatedData.logoUrl);
        return res.status(400).json({ message: 'Logo file not found in storage' });
      }

      logoPath = updatedData.logoUrl;
    }

    const updatedCoin = { ...updatedData, categories: parsedCategories, badges: parsedBadges, logo: logoPath };
    await Entity.Coin.updateOne({ id }, updatedCoin);
    if (coin.status === 'promoted') {
      await Entity.Promoted.updateOne({ id }, {
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
      });
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
    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }
    await Entity.Coin.deleteOne({ id });
    await Entity.Promoted.deleteOne({ id });
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
    const coin = await Entity.Coin.findOne({ id });
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
    const promotedCoins = await Entity.Promoted.find();
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
    const newCoins = await Entity.Coin.find().sort({ createdAt: -1 });
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
    const presaleCoins = await Entity.Coin.find({ status: { $in: ['approved', 'promoted'] }, presalePhase: { $exists: true, $ne: '' } });
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
    const supabase = req.supabase; // Use the Supabase client from req
    const { bannerUrl } = req.body;
    if (!bannerUrl) {
      return res.status(400).json({ message: 'No banner URL provided' });
    }
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Uploading banner:`, bannerUrl);
    const { data: fileData, error: fileError } = await supabase.storage
      .from('banners')
      .list('', { search: bannerUrl });

    if (fileError) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Supabase file check error:`, fileError);
      return res.status(500).json({ message: 'Error verifying banner file', error: fileError.message });
    }

    if (!fileData.find(file => file.name === bannerUrl)) {
      console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Banner file not found in Supabase:`, bannerUrl);
      return res.status(400).json({ message: 'Banner file not found in storage' });
    }

    const newBanner = new Entity.Banner({ filename: bannerUrl });
    await newBanner.save();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Banner uploaded:`, bannerUrl);
    res.status(200).json({ message: 'Banner uploaded successfully', filename: bannerUrl });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error uploading banner:`, {
      message: error.message, stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const supabase = req.supabase; // Use the Supabase client from req
    const { filename } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Deleting banner:`, filename);
    const banner = await Entity.Banner.findOne({ filename });
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    await Entity.Banner.deleteOne({ filename });
    // Optionally delete from Supabase
    await supabase.storage.from('banners').remove([filename]);
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
    const banners = await Entity.Banner.find();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning banners:`, banners);
    res.status(200).json(banners.map(b => b.filename));
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

    const coin = await Entity.Coin.findOne({ id });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }

    const user = await Entity.User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.coinCount < boostAmount) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    await Entity.User.updateOne({ id: userId }, { coinCount: user.coinCount - boostAmount });

    const currentBoosts = coin.boosts || 0;
    const currentDailyBoosts = coin.dailyBoosts || 0;
    
    await Entity.Coin.updateOne({ id }, { 
      boosts: currentBoosts + boostAmount,
      dailyBoosts: currentDailyBoosts + boostAmount
    });

    if (coin.status === 'promoted') {
      const promotedCoin = await Entity.Promoted.findOne({ id });
      if (promotedCoin) {
        await Entity.Promoted.updateOne({ id }, { 
          boosts: (promotedCoin.boosts || 0) + boostAmount
        });
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

module.exports = exports;