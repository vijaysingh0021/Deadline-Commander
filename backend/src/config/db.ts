import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB. Throws on failure rather than exiting so the API can
 * degrade gracefully into demo mode (snapshot persistence simply doesn't
 * attach) when no database is reachable.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/deadline-commander';
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};