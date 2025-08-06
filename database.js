
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

let db;

// Initialize SQLite database
export async function initDatabase() {
  try {
    db = await open({
      filename: join(__dirname, 'streaming.db'),
      driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS streams (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        stream_key TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        quality TEXT DEFAULT '720p',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE INDEX IF NOT EXISTS idx_streams_expires_at ON streams(expires_at);
      CREATE INDEX IF NOT EXISTS idx_streams_stream_key ON streams(stream_key);
    `);

    // Create default public user
    await createDefaultPublicUser();

    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Create default public user for open source usage
async function createDefaultPublicUser() {
  try {
    // Check if public user already exists
    const existingPublic = await db.get(
      'SELECT id FROM users WHERE username = ?',
      ['public']
    );
    
    if (!existingPublic) {
      await db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        ['public', 'public@streaming.local', 'no-password-required']
      );
      
      console.log('✅ Default public user created for open source streaming');
    } else {
      console.log('Public user already exists');
    }
  } catch (error) {
    console.error('Error creating default public user:', error);
  }
}

// User management functions
export async function createUser(username, email, password) {
  try {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const result = await db.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    
    return { id: result.lastID, username, email };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

export async function authenticateUser(username, password) {
  try {
    console.log('Authenticating user:', username);
    
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      console.log('User not found:', username);
      return null;
    }
    
    console.log('User found, checking password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', username);
      return null;
    }
    
    console.log('Password valid, generating token...');
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Stream management functions
export async function createStream(userId, title, description, quality) {
  try {
    const streamId = Math.random().toString(36).substring(2, 15);
    const streamKey = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await db.run(
      'INSERT INTO streams (id, user_id, title, description, stream_key, quality, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [streamId, userId, title, description, streamKey, quality, expiresAt.toISOString()]
    );
    
    return {
      id: streamId,
      title,
      description,
      streamKey,
      quality,
      status: 'pending',
      expiresAt
    };
  } catch (error) {
    throw error;
  }
}

export async function getUserStreams(userId) {
  try {
    const streams = await db.all(
      'SELECT * FROM streams WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    return streams.map(stream => ({
      ...stream,
      createdAt: new Date(stream.created_at),
      expiresAt: new Date(stream.expires_at)
    }));
  } catch (error) {
    throw error;
  }
}

export async function updateStreamStatus(streamId, status) {
  try {
    await db.run(
      'UPDATE streams SET status = ? WHERE id = ?',
      [status, streamId]
    );
  } catch (error) {
    throw error;
  }
}

export async function deleteStream(streamId, userId) {
  try {
    const result = await db.run(
      'DELETE FROM streams WHERE id = ? AND user_id = ?',
      [streamId, userId]
    );
    
    return result.changes > 0;
  } catch (error) {
    throw error;
  }
}

// Cleanup functions
export function startCleanupJob() {
  // Run cleanup every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await db.run(
        'DELETE FROM streams WHERE expires_at < ?',
        [new Date().toISOString()]
      );
      
      if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} expired streams`);
      }
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  });
  
  console.log('Stream cleanup job started');
}

export async function resetAdminPassword() {
  try {
    const saltRounds = 12;
    const newPassword = 'StreamAdmin123!';
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await db.run(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, 'admin']
    );
    
    if (result.changes > 0) {
      console.log('Admin password reset to: StreamAdmin123!');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Reset admin password error:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await db.get('SELECT COUNT(*) as user_count FROM users');
    return {
      status: 'connected',
      userCount: result.user_count,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw error;
  }
}

export { db };
