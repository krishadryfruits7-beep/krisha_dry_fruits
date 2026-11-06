import mongoose from 'mongoose';

let isConnected = false;

const PRIMARY_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://sanjay:Eternal_Flame@cluster0.t8wbojh.mongodb.net/krisha_dry_fruits?retryWrites=true&w=majority';

export async function connectDB(): Promise<void> {
  if (isConnected && mongoose.connection.readyState === 1) return;

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
