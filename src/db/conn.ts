import mongoose from 'mongoose';

const dbConnect = async () => {
  const connectionString = process.env.DB_URI || '';

  try {
    if (connectionString) await mongoose.connect(connectionString);
  } catch (error) {
    console.error('Database connection error: ', error);
  }
};

export default dbConnect;
