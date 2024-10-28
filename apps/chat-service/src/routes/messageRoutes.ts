import express from "express";

import { getMessages, getMessage } from "../controllers/messageControllers";

const messageRoutes = express.Router();

messageRoutes.route("/getMessages").post(getMessages);
messageRoutes.route("/getMessage").post(getMessage);

export default messageRoutes;
