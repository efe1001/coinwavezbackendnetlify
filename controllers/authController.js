const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Set default database structure
db.defaults({ admins: [], users: [], coins: [], promoted: [], banners: [] }).write();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_1234567890';

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received user registration data:`, { name, email });
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now().toString(), name, email, password: hashedPassword, coinCount: 0 };
    db.get('users').push(newUser).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User saved to db:`, newUser);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User registration error:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received admin registration data:`, { name, email });
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingAdmin = db.get('admins').find({ email }).value();
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = { id: Date.now().toString(), name, email, password: hashedPassword };
    db.get('admins').push(newAdmin).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Admin saved to db:`, newAdmin);

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Admin registration error:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received user login data:`, { email });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.get('users').find({ email }).value();
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User login successful:`, { userId: user.id, token: token.substring(0, 10) + '...' });
    res.status(200).json({ message: 'Login successful', name: user.name, token, coinCount: user.coinCount || 0 });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User login error:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Received admin login data:`, { email });
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = db.get('admins').find({ email }).value();
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Admin login successful:`, { adminId: admin.id, token: token.substring(0, 10) + '...' });
    res.status(200).json({ message: 'Login successful', name: admin.name, token });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Admin login error:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching users for admin:`, req.user.id);
    const users = db.get('users').value() || [];
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Returning users:`, users.map(u => ({ id: u.id, email: u.email, name: u.name, coinCount: u.coinCount })));
    res.status(200).json(users);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching users:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Deleting user:`, id);
    const user = db.get('users').find({ id }).value();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    db.set('users', db.get('users').filter((u) => u.id !== id).value()).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] User deleted:`, id);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error deleting user:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addCoinsToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { coins } = req.body;
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Adding coins to user ${userId}:`, { coins });

    if (!coins || isNaN(coins) || parseInt(coins) <= 0) {
      return res.status(400).json({ message: 'Invalid coins value' });
    }

    const user = db.get('users').find({ id: userId }).value();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.coinCount = (user.coinCount || 0) + parseInt(coins);
    db.get('users').find({ id: userId }).assign({ coinCount: user.coinCount }).write();
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Updated user ${userId} coin count to ${user.coinCount}`);

    res.status(200).json({ message: 'Coins added successfully', userId, coins: user.coinCount });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error adding coins:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Refresh token attempt:`, token ? token.substring(0, 10) + '...' : 'No token');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const user = db.get('users').find({ id: decoded.id }).value() || db.get('admins').find({ id: decoded.id }).value();
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }
    const newToken = jwt.sign(
      { id: user.id, role: user.role || (db.get('admins').find({ id: user.id }).value() ? 'admin' : 'user') },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Token refreshed for user:`, { userId: user.id, newToken: newToken.substring(0, 10) + '...' });
    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Refresh token error:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // From verifyToken middleware
    console.log(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Fetching current user:`, userId);

    let user = db.get('users').find({ id: userId }).value();
    let role = 'user';
    if (!user) {
      user = db.get('admins').find({ id: userId }).value();
      role = 'admin';
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      coinCount: user.coinCount || 0,
      role,
    });
  } catch (error) {
    console.error(`[${new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' })}] Error fetching current user:`, {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};