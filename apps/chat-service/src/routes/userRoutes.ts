import express from "express";
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  searchUsers,
  updateLastSeen
} from "../controllers/userControllers";

const userRoutes = express.Router();

userRoutes.route("/createUser").post(createUser);
userRoutes.route("/getUser").post(getUser);
userRoutes.route("/updateUser").put(updateUser);
userRoutes.route("/deleteUser").delete(deleteUser);
userRoutes.route("/searchUsers").post(searchUsers);
userRoutes.route("/updateLastSeen").put(updateLastSeen);

export default userRoutes;
