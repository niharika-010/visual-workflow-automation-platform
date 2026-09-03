import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserByEmail, createUser, findUserById } from '../models/user.model.js';

// Helper to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required and must be at least 2 characters',
      });
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'A valid email address is required',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required and must be at least 6 characters long',
      });
    }

    // Check for duplicate email
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is already registered',
      });
    }

    // Hash Password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create User
    const newUser = await createUser({
      name: name.trim(),
      email,
      passwordHash,
    });

    // Generate JWT Token
    const token = generateToken(newUser);

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'An error occurred during registration',
    });
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email address format',
      });
    }

    // Find User
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Compare Password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user is populated by authenticateToken middleware
    return res.status(200).json({
      status: 'success',
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user profile',
    });
  }
};
