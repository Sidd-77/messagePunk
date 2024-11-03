import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import MessageQueue from "./utils/messageQueue";
import { MessageType } from "./types";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";
import messageRoutes from "./routes/messageRoutes";
import sql from "./utils/db";
import { Request, Response } from "express";
import { initializeTables } from "./utils/db_intialize";

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const messageQueue = new MessageQueue();

async function processMessage(message: MessageType) {
  try {
    await sql`
      INSERT INTO messages (id, chat_id, type, user_id, status, message, timestamp)
      VALUES (${message.id}, ${message.chatId}, ${message.type}, ${message.user}, ${message.status}, ${message.message}, ${message.timestamp})
    `;
    console.log("Message saved successfully:");
  } catch (error) {
    console.error("Error in message processing:", error);
    throw error; // Rethrow to trigger message nack
  }
}

async function initializeServices() {
  try {
    await messageQueue.initialize();
    // Set up message consumer
    await messageQueue.consumeMessage(async (message: MessageType) => {
      await processMessage(message);
    });

    console.log("Message consumer initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
    process.exit(1);
  }
}

// heatlh check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now(),
    service: "chat-service",
  });
});

app.use("/users", userRoutes);
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Chat service is running");
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing connections...");
  await messageQueue.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Express server is running at http://localhost:${port}`);
  // initializeTables().catch(console.error);
  initializeServices().catch(console.error);
});

// method to close the server for testing
// export function closeServer(): void {
//   server.close();
// }

export default app;
