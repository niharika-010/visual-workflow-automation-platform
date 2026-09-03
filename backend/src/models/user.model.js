import { dbPool } from '../config/db.js';
import crypto from 'crypto';

// In-memory fallback repository when PostgreSQL container is offline
const inMemoryUsers = new Map();

export const findUserByEmail = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const result = await dbPool.query(
      'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  return inMemoryUsers.get(normalizedEmail) || null;
};

export const findUserById = async (id) => {
  try {
    const result = await dbPool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  for (const user of inMemoryUsers.values()) {
    if (user.id === id) {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    }
  }

  return null;
};

export const createUser = async ({ name, email, passwordHash }) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    const result = await dbPool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, updated_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );
    return result.rows[0];
  } catch (err) {
    // Check if error is unique constraint violation or DB connection error
    if (err.code === '23505') {
      const customError = new Error('Email already registered');
      customError.statusCode = 400;
      throw customError;
    }

    // Fallback to in-memory store if DB is offline
    if (inMemoryUsers.has(normalizedEmail)) {
      const customError = new Error('Email already registered');
      customError.statusCode = 400;
      throw customError;
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryUsers.set(normalizedEmail, newUser);
    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  }
};
