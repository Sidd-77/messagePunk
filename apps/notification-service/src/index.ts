// index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response } from "express";
dotenv.config();
import NotificationQueue from "./notificationQueues";
import subscriptionRouter from "./routes";
import { sendNotificationToUser } from "./subscritpionService";
const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: [process.env.ORIGIN || "http://localhost:3000"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());

const notificationQueue = new NotificationQueue();

async function processNotification(notification: any) {
  try {
    notification = JSON.parse(notification);
    const { userId, title, body, image, data } = notification;
    await sendNotificationToUser(userId, title, body, image, data);
    console.log("Notification sent to ", userId);
    return;
  } catch (error) {
    console.error("Error sending notifications:", error);
    return;
  }
}

async function initializeServices() {
  try {
    await notificationQueue.initialize();
    // Set up message consumer
    await notificationQueue.consumeNotifications(async (notification: any) => {
      await processNotification(notification);
    });

    console.log("Message consumer initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
    process.exit(1);
  }
}

// heatlh check
app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: Date.now(),
      service: "notification-service",
    });
});

app.use("/api", subscriptionRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("CORS enabled for:", ["http://localhost:3000"]);
  console.log("Available routes:");
  console.log("- GET /health");
  console.log("- POST /api/subscribe");
  console.log("- POST /api/push-notification");
  initializeServices().catch(console.error);
});
