'use strict';

// ──────────── Redis client (ioredis) ──────────────────────────────────────────
// If REDIS_URL is not set, all cache functions are no-ops that return null.
// The app works normally without Redis — errors are logged, never thrown.

let client = null;

if (process.env.REDIS_URL) {
  const Redis = require('ioredis');

  client = new Redis(process.env.REDIS_URL, {
    // Disable aggressive retry to avoid log spam when Redis is down
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: false,
  });

  client.on('connect', () => console.log('[Redis] Connected'));
  client.on('error', (err) => {
    console.error('[Redis] Error — running without cache:', err.message);
  });
} else {
  console.log('[Redis] REDIS_URL not set — caching disabled');
}

// ──────────── getCache ────────────────────────────────────────────────────────
/**
 * Retrieve a cached value by key.
 * @param {string} key
 * @returns {Promise<any|null>} Parsed JSON value or null on miss/error
 */
const getCache = async (key) => {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[Redis] getCache error:', err.message);
    return null;
  }
};

// ──────────── setCache ────────────────────────────────────────────────────────
/**
 * Store a value in cache with a TTL.
 * @param {string} key
 * @param {any}    value       Will be JSON.stringified
 * @param {number} ttlSeconds  Expiry in seconds
 * @returns {Promise<void>}
 */
const setCache = async (key, value, ttlSeconds) => {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    console.error('[Redis] setCache error:', err.message);
  }
};

// ──────────── deleteCache ─────────────────────────────────────────────────────
/**
 * Delete a single key from cache.
 * @param {string} key
 * @returns {Promise<void>}
 */
const deleteCache = async (key) => {
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error('[Redis] deleteCache error:', err.message);
  }
};

// ──────────── deleteCacheByPattern ───────────────────────────────────────────
/**
 * Delete all keys matching a glob pattern (e.g. `analytics:userId:*`).
 * Uses KEYS — suitable for low-volume dev/prod use; swap to SCAN for very large keyspaces.
 * @param {string} pattern
 * @returns {Promise<void>}
 */
const deleteCacheByPattern = async (pattern) => {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.error('[Redis] deleteCacheByPattern error:', err.message);
  }
};

module.exports = { getCache, setCache, deleteCache, deleteCacheByPattern };
