import express from "express";
import {
  createChat,
  addParticipant,
  removeParticipant,
  getChatInfo,
  getUserChats,
  deleteChat,
  updateChat
} from "../controllers/chatController";
// import { protect } from "../middlewares/authMiddleware";

const chatRoutes = express.Router();

chatRoutes.route("/createChat").post(createChat);
chatRoutes.route("/getChatInfo").post(getChatInfo);
chatRoutes.route("/getUserChats").post(getUserChats);
chatRoutes.route("/addParticipant").post(addParticipant);
chatRoutes.route("/removeParticipant").post(removeParticipant);
chatRoutes.route("/deleteChat").delete(deleteChat);
chatRoutes.route("/updateChat").put(updateChat);

export default chatRoutes;
