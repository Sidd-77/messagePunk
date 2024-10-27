import mongoose from "mongoose";
import { ChatType } from "../types";

const chatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ["personal", "group"], required: true },
  name: { type: String, required: true },
  members: { type: [String], required: true },
  createdAt: { type: String, required: true },
  lastMessage: { type: Object },
  avatar: { type: String },
  admin: { type: [String] },
});

export default mongoose.model<ChatType>("Chat", chatSchema);