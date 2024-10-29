// socket.ts
import { Server } from "socket.io";
import logger from "./utils/logger";
import Redis from "ioredis";
import { MessageType } from "./types";
import MessageQueue from "./messageQueue";
import * as dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const CHANNELS = {
  MESSAGE: "message",
  TYPING: "typing",
  PRESENCE: "presence",
  MESSAGE_STATUS: "message_status",
} as const;

interface TypingEvent {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface MessageStatus {
  messageId: string;
  chatId: string;
  userId: string;
  status: "delivered" | "read";
  timestamp: string;
}

interface UserPresence {
  userId: string;
  status: "online" | "offline";
  lastSeen: string;
}

class SocketService {
  public io: Server;
  private subscriber: Redis;
  private publisher: Redis;
  private messageQueue: MessageQueue;

  constructor() {
    this.io = new Server({
      cors: { origin: "*" }
    });

    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
    this.messageQueue = new MessageQueue();

    this.subscriber.subscribe(...Object.values(CHANNELS));

    
    this.listen();
    logger.info("Socket service initialized");
  }

  // private handleTypingEvent(event: TypingEvent) {
  //   this.io.to(`chat:${event.chatId}`).emit("typing", event);
  // }
  

  private async publishPresence(userId: string, status: "online" | "offline") {
    const presence: UserPresence = {
      userId,
      status,
      lastSeen: new Date().toISOString()
    };
    await this.publisher.publish(CHANNELS.PRESENCE, JSON.stringify(presence));
  }

  public listen() {
    this.io.on("connection", async (socket) => {
      logger.info("User connected:", socket.id);
      let userId: string;

      socket.on("auth", async (data: { userId: string }) => {
        userId = data.userId;
        await this.publishPresence(userId, "online");
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} authenticated`);
      });

      socket.on("typing", async (event: TypingEvent) => {
        await this.publisher.publish(CHANNELS.TYPING, JSON.stringify(event));
      });
  

      socket.on("join_chat", (joined: any) => {
        socket.join(`chat:${joined.chatId}`);
        logger.info(`User ${joined.userId} joined chat ${joined.chatId}`);
      });

      socket.on("message", async (msg: MessageType) => {
        try {
          await this.publisher.publish(CHANNELS.MESSAGE, JSON.stringify(msg));
          this.messageQueue.pushMessage(msg);
          // Emit delivery status
          const status: MessageStatus = {
            messageId: msg.id,
            chatId: msg.chatId,
            userId: typeof msg.user === 'string' ? msg.user : msg.user.id,
            status: "delivered",
            timestamp: new Date().toISOString()
          };
          await this.publisher.publish(CHANNELS.MESSAGE_STATUS, JSON.stringify(status));
        } catch (error) {
          logger.error("Error handling message:", error);
        }
      });

      

      socket.on("message_status", (status: MessageStatus) => {
        this.publisher.publish(CHANNELS.MESSAGE_STATUS, JSON.stringify(status));
      });

      socket.on("disconnect", async () => {
        if (userId) {
          await this.publishPresence(userId, "offline");
        }
        logger.info("User disconnected:", socket.id);
      });
    });

    this.subscriber.on("message", (channel, message) => {
      try {
        const data = JSON.parse(message);
        switch (channel) {
          case CHANNELS.MESSAGE:
            this.io.to(`chat:${data.chatId}`).emit("receive_message", data);
            break;

          case CHANNELS.TYPING:
            this.io.to(`chat:${data.chatId}`).emit("typing", data)
            break;

          case CHANNELS.PRESENCE:
            this.io.emit("presence", data);
            break;
          case CHANNELS.MESSAGE_STATUS:
            this.io.to(`chat:${data.chatId}`).emit("message_status", data);
            break;
        }
      } catch (error) {
        logger.error("Error handling Redis message:", error);
      }
    });
  }

  public async cleanup() {
    await this.subscriber.quit();
    await this.publisher.quit();
    await this.io.close();
  }
}

export default SocketService;