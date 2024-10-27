import mongoose from "mongoose";
import * as dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/chat-service";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURL);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
