import mongoose from "mongoose";
import { UserType } from "../../types";

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String },
  online: { type: Boolean, default: false },
});

export default mongoose.model<UserType>("User", userSchema);
