import { dbPool } from '../config/db.js';
import crypto from 'crypto';

const inMemoryCredentials = new Map();

export const createCredential = async ({ userId, name, type, data }) => {
  try {
    const client = await dbPool.connect();
    const result = await client.query(
      `INSERT INTO credentials (user_id, name, type, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, name, type, created_at, updated_at`,
      [userId, name.trim(), type, JSON.stringify(data)]
    );
    client.release();
    return result.rows[0];
  } catch (err) {
    const newCred = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name.trim(),
      type,
      data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryCredentials.set(newCred.id, newCred);
    return {
      id: newCred.id,
      user_id: newCred.user_id,
      name: newCred.name,
      type: newCred.type,
      created_at: newCred.created_at,
      updated_at: newCred.updated_at,
    };
  }
};

export const getCredentialsByUserId = async (userId) => {
  try {
    const result = await dbPool.query(
      `SELECT id, user_id, name, type, created_at, updated_at
       FROM credentials
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    const list = [];
    for (const cred of inMemoryCredentials.values()) {
      if (cred.user_id === userId) {
        list.push({
          id: cred.id,
          user_id: cred.user_id,
          name: cred.name,
          type: cred.type,
          created_at: cred.created_at,
          updated_at: cred.updated_at,
        });
      }
    }
    return list;
  }
};

export const getCredentialById = async (id, userId = null) => {
  try {
    const client = await dbPool.connect();
    let query = `SELECT id, user_id, name, type, data, created_at, updated_at FROM credentials WHERE id = $1`;
    const params = [id];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await client.query(query, params);
    client.release();

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        ...row,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      };
    }
    return null;
  } catch (err) {
    const cred = inMemoryCredentials.get(id);
    if (cred && (!userId || cred.user_id === userId)) {
      return cred;
    }
    return null;
  }
};

export const deleteCredential = async (id, userId) => {
  try {
    const result = await dbPool.query(
      `DELETE FROM credentials WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rowCount > 0;
  } catch (err) {
    const cred = inMemoryCredentials.get(id);
    if (cred && cred.user_id === userId) {
      inMemoryCredentials.delete(id);
      return true;
    }
    return false;
  }
};
