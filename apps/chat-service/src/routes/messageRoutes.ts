import express from "express";

import {
  sendMessage,
  getChatMessages,
  markChatMessagesAsRead,
  deleteMessage,
  updateMessage,
  markMessageAsRead,
  getUnreadMessageCount
} from "../controllers/messageControllers";

const messageRoutes = express.Router();

messageRoutes.route("/sendMessage").post(sendMessage);
messageRoutes.route("/getChatMessages").post(getChatMessages);
messageRoutes.route("/markChatMessagesAsRead").put(markChatMessagesAsRead);
messageRoutes.route("/deleteMessage").delete(deleteMessage);
messageRoutes.route("/updateMessage").put(updateMessage);
messageRoutes.route("/markMessageAsRead").put(markMessageAsRead);
messageRoutes.route("/getUnreadMessageCount").post(getUnreadMessageCount);

export default messageRoutes;
