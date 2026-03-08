import mongoose from 'mongoose';

export const connectMongo = async ({ mongoUri }) => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Failed to connect MongoDB:', error);
        throw error;
    }
};
