import mongoose from "mongoose";
import { ChatType } from "../types";

const chatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ["personal", "group"], required: true },
  name: { type: String, required: true },
  members: [{ type: String, required: true, ref: "User", refPath: "id" }],
  createdAt: { type: String, required: true },
  lastMessage: { type: String, ref: "Message", refPath: "id" },
  avatar: { type: String },
  admin: [{ type: String, ref: "User", refPath: "id" }],
});

chatSchema.index({ id: 1 });
chatSchema.index({ members: 1 });

export default mongoose.model<ChatType>("Chat", chatSchema);
