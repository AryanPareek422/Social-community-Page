const express = require('express');
require('dotenv').config()
const mongoose = require('mongoose');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 8000;

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// MongoDB connection with proper error handling
const uri = process.env.MONGODB_URL;

let isConnecting = false;

const connectMongoDB = async () => {
    if (!uri) {
        console.warn("  MONGODB_URL not found in .env file. Server running without database connection.");
        return;
    }

    if (isConnecting || mongoose.connection.readyState === 1) {
        return; // Already connected or connecting
    }

    isConnecting = true;
    
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        });
        console.log(" Connected to MongoDB");
        isConnecting = false;
    } catch (err) {
        isConnecting = false;
        console.error(" Failed to connect to MongoDB:", err.message);
        console.log("  Server will continue without database connection.");
        console.log(" Make sure MongoDB is running or update MONGODB_URL in .env");
    }
};

// MongoDB connection event handlers
if (uri) {
    const db = mongoose.connection;

    db.on('connected', () => {
        console.log(" MongoDB connected");
    });

    db.on('error', (err) => {
        console.error(" MongoDB connection error:", err.message);
        // Don't crash server - just log the error
    });

    db.on('disconnected', () => {
        console.log(" MongoDB disconnected");
        // Mongoose will automatically attempt to reconnect
        // No need for manual reconnection
    });

    // Initial connection attempt
    connectMongoDB();
}

// Global error handlers - prevent crashes
process.on('unhandledRejection', (err) => {
    console.error('  Unhandled Promise Rejection:', err.message || err);
    // Log but don't exit - let server continue running
});

process.on('uncaughtException', (err) => {
    console.error(' Uncaught Exception:', err.message || err);
    // Only exit for truly critical errors
    if (err.code === 'EADDRINUSE') {
        console.error(` Port ${port} is already in use.`);
        process.exit(1);
    }
    // For other errors, log and continue
    console.error('  Server will continue running...');
});

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Server is running!', 
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        port: port 
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// User routes
const userRoute = require('./routes/userRoute');
app.use('/user', cors(), userRoute);

//post routes
const postRoute = require('./routes/postRoute');
app.use('/post', cors(), postRoute);

// Start server with proper error handling
const server = app.listen(port, () => {
    console.log(` Server running on port ${port}`);
    console.log(` Health check: http://localhost:${port}/health`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(` Port ${port} is already in use.`);
        console.error(` To find and kill the process: netstat -ano | findstr :${port}`);
        console.error(` Or use: Get-Process -Name node | Stop-Process -Force`);
        process.exit(1);
    } else {
        console.error(' Server error:', err.message);
        process.exit(1);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});
