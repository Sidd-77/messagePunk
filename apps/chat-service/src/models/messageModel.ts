import mongoose, { Schema, Document } from "mongoose";
import { MessageType } from "../types";

const MessageSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  message: { type: String, required: true },
  user: { type: String, required: true }, // userId of the sender
  chatId: { type: String, required: true },
  timestamp: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "image", "file", "system"],
    required: true,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    required: true,
  },
  readBy: { type: [String], default: [] },
});

export default mongoose.model<MessageType>("Message", MessageSchema);
