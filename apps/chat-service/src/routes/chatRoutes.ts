import express from "express";
import {
  createChat,
  addMember,
  getChats,
  getChatInfo,
  removeMember,
  deleteChat,
  renameChat,
} from "../controllers/chatController";
// import { protect } from "../middlewares/authMiddleware";

const chatRoutes = express.Router();

chatRoutes.route("/createChat").post(createChat);
chatRoutes.route("/getChatInfo").post(getChatInfo);
chatRoutes.route("/getChats").post(getChats);
chatRoutes.route("/addMember").post(addMember);
chatRoutes.route("/removeMember").post(removeMember);
chatRoutes.route("/deleteChat").delete(deleteChat);
chatRoutes.route("/renameChat").put(renameChat);

export default chatRoutes;
