const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const feeRoutes = require('./routes/feeRoutes');
const resultRoutes = require('./routes/resultRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const { redis } = require('./middleware/cache');
const { connectToDatabase, getDatabaseHealth } = require('./config/database');
const { sendApiError, sendDatabaseUnavailable } = require('./utils/apiError');

const app = express();
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Global security middleware — sanitize NoSQL injection keys
const cleanObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key in obj) {
        if (key.startsWith('$') || key.includes('.')) {
            const safeKey = key.replace(/^\$|\./g, '_');
            obj[safeKey] = obj[key];
            delete obj[key];
        }
        if (typeof obj[key] === 'object') cleanObj(obj[key]);
    }
    return obj;
};
app.use((req, res, next) => {
    // Only clean body on mutation requests (POST/PUT/PATCH) — GET bodies are typically empty
    if (req.body && typeof req.body === 'object' && req.method !== 'GET') {
        cleanObj(req.body);
    }
    next();
});

// Health Check
app.get('/api/health', async (req, res) => {
    const { getDatabaseHealth, connectToDatabase } = require('./config/database');
    
    let database = getDatabaseHealth();
    if (!database.isHealthy) {
        try {
            await connectToDatabase();
            database = getDatabaseHealth();
        } catch (mErr) {
            // console.error('Mongo Health Fix failed:', mErr.message);
        }
    }

    res.json({
        status: 'ok',
        mongodb: database.status,
        redis: (require('./middleware/cache').redis) ? 'connected' : 'disabled',
        lastConnectedAt: database.lastConnectedAt,
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'missing',
            JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Ensure DB is connected before route handlers (important for serverless runtime)
app.use('/api', async (req, res, next) => {
    try {
        const health = getDatabaseHealth();
        if (!health.isHealthy) {
            await connectToDatabase();
        }
        return next();
    } catch (error) {
        return sendDatabaseUnavailable(res);
    }
});

// Routes
const testRoutes = require('./routes/testRoutes');
app.use('/api', testRoutes);
app.use('/api', authRoutes);
app.use('/api', notificationRoutes);
app.use('/api/student/fees', feeRoutes);
app.use('/api/student/results', resultRoutes);
app.use('/api/support', supportRoutes);

const PORT = process.env.PORT || 5006;

// Error Handling Middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

if (require.main === module) {
    connectToDatabase()
        .catch((err) => {/* console.error('MongoDB connection error:', err.message); */});

    app.listen(PORT);
}

module.exports = app;
