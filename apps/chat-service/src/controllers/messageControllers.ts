import { Request, Response } from "express";
import { MessageType } from "../../types";
import Message from "../models/messageModel";

export const getMessages = async (req: Request, res: Response):Promise<any> => {
    const { chatId } = req.body;
    try {
        const messages = await Message.find({ chatId });
        res.status(200).send(messages);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getMessage = async (req: Request, res: Response):Promise<any> => {
    const { messageId } = req.body;
    try {
        const message = await Message.findOne({ id: messageId });
        if (!message) {
            return res.status(404).send({ message: "Message not found" });
        }
        res.status(200).send(message);
    } catch (error) {
        res.status(500).send(error);
    }
};