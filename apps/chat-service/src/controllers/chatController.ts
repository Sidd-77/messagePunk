import { Request, Response } from "express";
import Chat from "../models/chatModel";
// import User from "../models/userModel";

export const createChat = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id, type, name, members, admin } = req.body;
    const chat = new Chat({ id, type, name, members, admin });
    await chat.save();
    res.status(201).send(chat);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getChats = async (req: Request, res: Response):Promise<any> => {
    const { userId } = req.body;
  try {
    const chats = await Chat.find({ members: userId });
    res.status(200).send(chats);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getChatInfo = async (req: Request, res: Response):Promise<any> => {
  try {
    const chat = await Chat.findOne({ id: req.body.chatId });
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    res.status(200).send(chat);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const addMember = async (req: Request, res: Response):Promise<any> => {
  const { chatId, member } = req.body;
  try {
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    chat.members.push(member);
    await chat.save();
    res.status(200).send(chat);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const removeMember = async (req: Request, res: Response):Promise<any> => {
  const { chatId, member } = req.body;
  try {
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    chat.members = chat.members.filter((m) => m !== member);
    await chat.save();
    res.status(200).send(chat);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const deleteChat = async (req: Request, res: Response):Promise<any> => {
  try {
    await Chat.deleteOne({ id: req.body.chatId });
    res.status(200).send({ message: "Chat deleted" });
  } catch (error) {
    res.status(500).send(error);
  }
};

export const renameChat = async (req: Request, res: Response):Promise<any> => {
  const { chatId, name } = req.body;
  try {
    const chat = await Chat.findOne({ id: chatId });
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    chat.name = name;
    await chat.save();
    res.status(200).send(chat);
  } catch (error) {
    res.status(500).send(error);
  }
};
