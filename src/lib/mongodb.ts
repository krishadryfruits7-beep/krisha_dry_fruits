import mongoose from 'mongoose';

let isConnected = false;

const PRIMARY_URI = process.env.MONGODB_URI || '';

export async function connectDB(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) return;

  if (!PRIMARY_URI) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  try {
    await mongoose.connect(PRIMARY_URI, {
      serverSelectionTimeoutMS: 6000,
    });
    isConnected = true;
  } catch (err: any) {
    console.error('MongoDB Atlas connection failed on Cluster0:', err.message);
    throw err;
  }
}
