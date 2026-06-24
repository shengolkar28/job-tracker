const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt.utils');


const SALT_ROUNDS = 12;

// ──────────── Register ────────────

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if email already taken
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password and create user
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password_hash },
    });

    // Generate access token
    const accessToken = generateAccessToken(user.id);

    return res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        reminder_enabled: user.reminder_enabled,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Login ────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        reminder_enabled: user.reminder_enabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Logout ────────────

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find user with this refresh token and clear it
      const user = await prisma.user.findFirst({
        where: { refresh_token: refreshToken },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refresh_token: null },
        });
      }
    }

    // Clear the cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ──────────── Refresh Token ────────────

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists in DB (not logged out)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken(user.id);

    return res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        reminder_enabled: user.reminder_enabled,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired, please login again' });
    }
    console.error('Refresh error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ──────────── Get Current User ────────────

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        reminder_enabled: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { register, login, logout, refresh, getMe };
