const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/drive_db';
    
    await mongoose.connect(mongoURI);
    
    console.log(`✅ MongoDB Connected Successfully!`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB:`, error.message);
    process.exit(1);
  }
};

module.exports = connectDB;