import { Request, Response } from "express";
import User from "../models/userModel";

export const createUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, name, email, avatar } = req.body;
    const alreadyExist = User.findOne({ id: id });
    if (alreadyExist) res.status(201).send(alreadyExist);
    const user = new User({ id, name, email, avatar });
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ id: req.body.userId });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    res.send(500).send(error);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, name, email, avatar } = req.body;
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    user.name = name;
    user.email = email;
    user.avatar = avatar;
    await user.save();
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    await User.deleteOne({ id: req.body.userId });
    res.status(200).send({ message: "User deleted" });
  } catch (error) {
    res.status(500).send(error);
  }
};
