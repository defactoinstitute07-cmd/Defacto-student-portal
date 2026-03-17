const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';
const CONNECTION_TIMEOUT_MS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000', 10);
const SOCKET_TIMEOUT_MS = parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '20000', 10);
const MAX_POOL_SIZE = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10);

mongoose.set('bufferCommands', false);

const globalCache = globalThis.__studentErpMongoCache || (globalThis.__studentErpMongoCache = {
    connection: null,
    connectionPromise: null,
    lastError: null,
    lastConnectedAt: null,
    listenersRegistered: false
});

const readyStateLabel = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

const registerConnectionListeners = () => {
    if (globalCache.listenersRegistered) {
        return;
    }

    globalCache.listenersRegistered = true;

    mongoose.connection.on('connected', () => {
        globalCache.connection = mongoose.connection;
        globalCache.lastConnectedAt = new Date().toISOString();
        globalCache.lastError = null;
    });

    mongoose.connection.on('disconnected', () => {
        globalCache.connection = null;
    });

    mongoose.connection.on('error', (error) => {
        globalCache.lastError = {
            name: error.name,
            message: error.message,
            at: new Date().toISOString()
        };
    });
};

const connectToDatabase = async () => {
    registerConnectionListeners();

    if (mongoose.connection.readyState === 1 && globalCache.connection) {
        return globalCache.connection;
    }

    if (globalCache.connectionPromise) {
        return globalCache.connectionPromise;
    }

    globalCache.connectionPromise = mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
        socketTimeoutMS: SOCKET_TIMEOUT_MS,
        maxPoolSize: MAX_POOL_SIZE,
        family: 4
    })
        .then((mongooseInstance) => {
            globalCache.connection = mongooseInstance.connection;
            globalCache.lastConnectedAt = new Date().toISOString();
            globalCache.lastError = null;
            return mongooseInstance.connection;
        })
        .catch((error) => {
            globalCache.lastError = {
                name: error.name,
                message: error.message,
                at: new Date().toISOString()
            };
            throw error;
        })
        .finally(() => {
            globalCache.connectionPromise = null;
        });

    return globalCache.connectionPromise;
};

const getDatabaseHealth = () => ({
    readyState: mongoose.connection.readyState,
    status: readyStateLabel[mongoose.connection.readyState] || 'unknown',
    isHealthy: mongoose.connection.readyState === 1,
    lastConnectedAt: globalCache.lastConnectedAt,
    lastError: globalCache.lastError
});

module.exports = {
    connectToDatabase,
    getDatabaseHealth
};
