const mongoose = require('mongoose');
const dns = require('dns');

// Only apply custom DNS on Windows where ISP DNS drops SRV records (querySrv ECONNREFUSED)
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // fallback gracefully
  }
}

/**
 * Establishes a connection to MongoDB using the URI in process.env.MONGO_URI.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    return null;
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // In production, log instead of immediate hard crash to allow health check diagnostics
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

process.on('SIGINT', async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  console.log('🛑 MongoDB connection closed due to app termination (SIGINT)');
  process.exit(0);
});

module.exports = connectDB;
