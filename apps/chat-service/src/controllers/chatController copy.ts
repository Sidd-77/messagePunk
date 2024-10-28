import { Request, Response } from "express";
import Chat from "../models/chatModel";

export const createChat = async (req: Request, res: Response):Promise<any> => {
  try {
    const { id, type, name, members, admin, createdAt } = req.body;
    const chat = new Chat({ id, type, name, members, admin, createdAt });
    await chat.save();
    res.status(201).send(chat);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const getChats = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.body;
  console.log('Fetching chats for userId:', userId);
  
  try {
    const chats = await Chat.find({ members: userId })
      .populate({
        path: 'members',
        select: 'id username email profilePicture' // Adjust fields based on your User model
      })
      .populate({
        path: 'lastMessage',
        select: 'id content createdAt' // Adjust fields based on your Message model
      })
      .populate({
        path: 'admin',
        select: 'id username email' // Adjust fields based on your User model
      });

    console.log('Found chats:', chats);
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ 
      message: 'Error fetching chats', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getChatInfo = async (req: Request, res: Response):Promise<any> => {
  try {
    const chat = await Chat.findOne({ id: req.body.chatId })
    .populate('members')
    .populate('lastMessage')
    .populate('admin');
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
    const chat = await Chat.findOne({ id: chatId })

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
    const chat = await Chat.findOne({ id: chatId }).populate('members');
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    
    console.log("Not implemented yet!!!!!!!!!!!!!!!!!!!!!1");

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
