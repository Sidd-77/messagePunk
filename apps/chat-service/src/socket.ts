import { Server } from "socket.io";
import logger from "./utils/logger";
import Redis from "ioredis";
import { handleMessages } from "./controllers/messageHandlers";
import { MessageType, ChatType, UserPresence } from "./types";
import * as dotenv from "dotenv";
import { log } from "winston";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Define Redis channels
const CHANNELS = {
  MESSAGE: "message",
  TYPING: "typing",
  PRESENCE: "presence",
  GROUP_EVENTS: "group_events",
  MESSAGE_STATUS: "message_status",
};

interface GroupEvent {
  type: "join" | "leave" | "add" | "remove";
  chatId: string;
  userId: string;
  timestamp: string;
}

interface TypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

interface MessageStatus {
  messageId: string;
  chatId: string;
  userId: string;
  status: "delivered" | "read";
  timestamp: string;
}

class SocketService {
  public io: Server;
  private subscriber: Redis;
  private publisher: Redis;
  private presenceClient: Redis;

  constructor() {
    logger.info("Socket service initializing");

    // Initialize Socket.IO
    this.io = new Server({
      cors: {
        origin: "*",
      },
    });

    // Initialize Redis clients
    this.subscriber = new Redis(redisUrl);
    this.publisher = new Redis(redisUrl);
    this.presenceClient = new Redis(redisUrl);

    // Subscribe to all channels
    this.subscriber.subscribe(...Object.values(CHANNELS));

    this.listen();
  }

  private async setUserPresence(userId: string, status: "online" | "offline") {
    const presence: UserPresence = {
      userId,
      status,
      lastSeen: new Date().toISOString(),
    };
    await this.presenceClient.hset(
      "user_presence",
      userId,
      JSON.stringify(presence)
    );
    this.publisher.publish(CHANNELS.PRESENCE, JSON.stringify(presence));
  }

  private async handleGroupEvent(event: GroupEvent) {
    // Publish group event to Redis
    await this.publisher.publish(CHANNELS.GROUP_EVENTS, JSON.stringify(event));
  }

  private async handleTyping(event: TypingEvent) {
    // Publish typing event to Redis
    await this.publisher.publish(CHANNELS.TYPING, JSON.stringify(event));
  }

  private async handleMessageStatus(status: MessageStatus) {
    // Publish message status to Redis
    await this.publisher.publish(
      CHANNELS.MESSAGE_STATUS,
      JSON.stringify(status)
    );
  }

  public listen() {
    logger.info("Socket service listening");

    this.io.on("connection", async (socket) => {
      logger.info("User connected:", socket.id);
      let userId: string;

      // Handle user authentication and presence
      socket.on("auth", async (data: { userId: string }) => {
        userId = data.userId;
        await this.setUserPresence(userId, "online");

        // Join user's personal channel
        socket.join(`user:${userId}`);
        logger.info(`User ${userId} authenticated`);
      });

      // Handle joining chats
      socket.on(
        "join_chat",
        async (data: { chatId: string; userId: string }) => {
          const { chatId, userId } = data;
          socket.join(`chat:${chatId}`);

          // For group chats, emit join event
          const event: GroupEvent = {
            type: "join",
            chatId,
            userId,
            timestamp: new Date().toISOString(),
          };
          await this.handleGroupEvent(event);
          logger.info(`User ${userId} joined chat ${chatId}`);
        }
      );

      // Handle messages
      socket.on("message", async (msg: MessageType) => {
        try {
          // Publish message to Redis
          console.log("Message Received:", msg);

          await this.publisher.publish(CHANNELS.MESSAGE, JSON.stringify(msg));

          // Handle message delivery status
          const deliveryStatus: MessageStatus = {
            messageId: msg.id,
            chatId: msg.chatId,
            userId: msg.user,
            status: "delivered",
            timestamp: new Date().toISOString(),
          };
          await this.handleMessageStatus(deliveryStatus);
        } catch (error) {
          logger.error("Error handling message:", error);
        }
      });

      // Handle typing indicators
      socket.on("typing", async (data: TypingEvent) => {
        await this.handleTyping(data);
      });

      // Handle message status updates
      socket.on("message_status", async (status: MessageStatus) => {
        await this.handleMessageStatus(status);
      });

      // Handle group chat events
      socket.on("group_event", async (event: GroupEvent) => {
        await this.handleGroupEvent(event);
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        if (userId) {
          await this.setUserPresence(userId, "offline");
        }
        logger.info("User disconnected:", socket.id);
      });
    });

    // Handle Redis subscription messages
    this.subscriber.on("message", (channel, message) => {
      try {
        const data = JSON.parse(message);

        switch (channel) {
          case CHANNELS.MESSAGE:
            // Emit to specific chat room
            logger.info(`Emitting message to chat:${data.chatId} - ${data}`);
            this.io.to(`chat:${data.chatId}`).emit("message", data);
            break;

          case CHANNELS.TYPING:
            // Emit typing status to chat room
            this.io.to(`chat:${data.chatId}`).emit("typing_status", data);
            break;

          case CHANNELS.PRESENCE:
            // Broadcast presence to all connected clients
            this.io.emit("presence_update", data);
            break;

          case CHANNELS.GROUP_EVENTS:
            // Emit group events to specific chat room
            this.io.to(`chat:${data.chatId}`).emit("group_update", data);
            break;

          case CHANNELS.MESSAGE_STATUS:
            // Emit message status to relevant users
            this.io
              .to(`chat:${data.chatId}`)
              .emit("message_status_update", data);
            break;

          default:
            logger.warn("Unknown channel:", channel);
        }
      } catch (error) {
        logger.error("Error handling Redis message:", error);
      }
    });

    // Error handling for Redis
    this.subscriber.on("error", (err) =>
      logger.error("Redis Subscriber Error:", err)
    );
    this.publisher.on("error", (err) =>
      logger.error("Redis Publisher Error:", err)
    );
    this.presenceClient.on("error", (err) =>
      logger.error("Redis Presence Error:", err)
    );
  }

  // Cleanup method
  public async cleanup() {
    await this.subscriber.quit();
    await this.publisher.quit();
    await this.presenceClient.quit();
    await this.io.close();
  }
}

export default SocketService;
