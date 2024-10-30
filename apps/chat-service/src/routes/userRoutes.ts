import express from "express";
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  searchUsers,
} from "../controllers/userControllers";

const userRoutes = express.Router();

userRoutes.route("/createUser").post(createUser);
userRoutes.route("/getUser").post(getUser);
userRoutes.route("/updateUser").put(updateUser);
userRoutes.route("/deleteUser").delete(deleteUser);
userRoutes.route("/searchUsers").post(searchUsers);

export default userRoutes;
