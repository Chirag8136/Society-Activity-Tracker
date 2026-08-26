const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows/ISP DNS servers failing on MongoDB Atlas SRV records (querySrv ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback gracefully
}

/**
 * Establishes a connection to MongoDB using the URI in process.env.MONGO_URI.
 * Exits the process on initial connection failure (fail-fast), and logs
 * (without crashing) on connection issues that occur later at runtime.
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in your environment variables (.env)');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Runtime connection event listeners (do not exit the process for these)
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
    console.error(`❌ MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed due to app termination (SIGINT)');
  process.exit(0);
});

module.exports = connectDB;
