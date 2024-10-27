import express from 'express';
import connectDB from './utils/db';
import MessageQueue from './utils/messageQueue';
import { MessageType } from '../types';
import Message from './models/messageModel';
import cors from "cors";
import chatRoutes from './routes/chatRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors({
  origin: "*",
}))

const messageQueue = new MessageQueue();

async function processMessage(message: MessageType): Promise<void> {
  try {
    const msg = new Message(message);
    await msg.save();
    console.log('Message saved successfully:', msg);
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error; // Rethrow to trigger message nack
  }
}


async function initializeServices() {
  try {
    await connectDB();
    await messageQueue.initialize();
    
    // Set up message consumer
    await messageQueue.consumeMessage(async (message: MessageType) => {
      await processMessage(message);
    });

    console.log('Message consumer initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

app.use("/users", userRoutes)
app.use("/chats", chatRoutes)

app.get('/', (req, res) => {
  res.send('Chat service is running');
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing connections...');
  await messageQueue.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
  initializeServices().catch(console.error);
});

