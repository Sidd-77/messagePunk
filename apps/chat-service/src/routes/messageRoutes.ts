import express from "express";

import {
  getMessages,
  getMessage,
  createMessage,
} from "../controllers/messageControllers";

const messageRoutes = express.Router();

messageRoutes.route("/getMessages").post(getMessages);
messageRoutes.route("/getMessage").post(getMessage);
messageRoutes.route("/createMessage").post(createMessage);

export default messageRoutes;
