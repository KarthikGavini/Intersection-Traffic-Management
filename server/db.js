// server/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectDB = async () => {
  // Move this line from the top of the file to inside the function
  const MONGO_URI = process.env.MONGO_URI;
  console.log(MONGO_URI)

  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is not defined in the .env file');
    }
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;