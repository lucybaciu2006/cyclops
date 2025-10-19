import mongoose from 'mongoose';
import {env} from "./env";

export const connectToMongoose = async () => {
    const uri = env.MONGO_URI || 'mongodb://localhost:27017/cyclops';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB with Mongoose on ' + uri);
};
