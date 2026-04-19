const Redis = require('ioredis');
const { LRUCache } = require('lru-cache');

const defaultTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 60);
const memoryCache = new LRUCache({ max: 500, ttl: defaultTtlSeconds * 1000 });

let redis = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
    redis.on('error', () => {
        // Fail silently to keep API responsive if Redis is down.
    });
}

const buildKey = (prefix, userId, url) => `${prefix}:${userId}:${url}`;

// Consistent serialization: store JSON strings in both memory and Redis
// to avoid double-serialize and guarantee identical read behavior.
const getCache = async (key) => {
    const memoryResult = memoryCache.get(key);
    if (memoryResult) return JSON.parse(memoryResult);

    if (redis) {
        try {
            const redisResult = await redis.get(key);
            if (redisResult) {
                // Backfill memory cache from Redis
                memoryCache.set(key, redisResult);
                return JSON.parse(redisResult);
            }
        } catch {
            // Ignore Redis errors
        }
    }

    return undefined;
};

const setCache = async (key, value, ttlSeconds) => {
    const serialized = JSON.stringify(value);
    memoryCache.set(key, serialized, { ttl: ttlSeconds * 1000 });
    if (redis) {
        await redis.set(key, serialized, 'EX', ttlSeconds).catch(() => {});
    }
};

const cacheMiddleware = (ttlSeconds = defaultTtlSeconds, options = {}) => async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const { prefix = 'cache', varyByUser = true } = options;
    const userKey = varyByUser ? (req.user?.id || req.user?._id || 'public') : 'public';
    const key = buildKey(prefix, userKey, req.originalUrl);

    try {
        const cached = await getCache(key);
        if (cached) return res.json(cached);
    } catch (err) {
        // ignore cache failures
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        setCache(key, body, ttlSeconds).catch(() => {});
        return originalJson(body);
    };

    next();
};

const invalidateUserCache = async (userId, prefix = 'cache') => {
    const userKey = userId || 'public';
    const memoryKeys = Array.from(memoryCache.keys());
    memoryKeys.forEach((key) => {
        if (key.startsWith(`${prefix}:${userKey}:`)) memoryCache.delete(key);
    });

    if (!redis) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}:${userKey}:*`, 'COUNT', 100);
            if (keys.length) await redis.del(keys);
            cursor = nextCursor;
        } while (cursor !== '0');
    } catch {
        // Ignore Redis errors during invalidation
    }
};

module.exports = {
    cacheMiddleware,
    invalidateUserCache,
    redis
};
