import mongoose from "mongoose";
import { MessageType } from "../types";

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  message: { type: String, required: true },
  user: { type: String, required: true, ref: 'User', refPath: 'id' },
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
  readBy: [{ type: String, ref: 'User', refPath: 'id' }]
});

messageSchema.index({ id: 1 });
messageSchema.index({ chatId: 1 });

export default mongoose.model<MessageType>("Message", messageSchema);
