import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../models/user.model.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token missing or unauthorized',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token has expired. Please login again.',
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token',
    });
  }
};
