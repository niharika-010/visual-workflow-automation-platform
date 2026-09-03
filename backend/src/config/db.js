import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

export const dbPool = new Pool({
  connectionString: config.databaseUrl,
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

dbPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Auto-initialize DB schema if connected
export const initDbTables = async () => {
  try {
    const client = await dbPool.connect();
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workflows (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'draft',
          workflow_json JSONB DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
          version INT DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workflow_versions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
          version INT NOT NULL,
          workflow_json JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS executions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          finished_at TIMESTAMP WITH TIME ZONE,
          input_data JSONB DEFAULT '{}'::jsonb,
          output_data JSONB DEFAULT '{}'::jsonb,
          error TEXT
      );

      CREATE TABLE IF NOT EXISTS execution_steps (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
          node_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'running',
          input_data JSONB DEFAULT '{}'::jsonb,
          output_data JSONB DEFAULT '{}'::jsonb,
          error TEXT,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          finished_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS credentials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log('✅ PostgreSQL Schema tables (users, workflows, versions, executions, steps, credentials) initialized.');
  } catch (error) {
    console.warn(`ℹ️ PostgreSQL init schema skipped: ${error.message} (Using in-memory repository fallback if DB offline)`);
  }
};

export const checkDatabaseConnection = async () => {
  try {
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    return {
      connected: true,
      time: result.rows[0].current_time,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};
