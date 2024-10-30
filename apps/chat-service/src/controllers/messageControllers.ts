import { Request, Response } from "express";
import sql from "../utils/db";

export const getMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { chatId } = req.body;

    const messages = await sql`
        SELECT 
          m.*,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatar', u.avatar
          ) as user,
          array_agg(DISTINCT jsonb_build_object(
            'id', rb.user_id,
            'name', rb_user.name,
            'avatar', rb_user.avatar
          )) as read_by
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN message_read_by rb ON m.id = rb.message_id
        LEFT JOIN users rb_user ON rb.user_id = rb_user.id
        WHERE m.chat_id = ${chatId}
        GROUP BY m.id, u.id, u.name, u.email, u.avatar
        ORDER BY m.timestamp 
      `;

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

export const getMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { messageId } = req.body;

    const [message] = await sql`
        SELECT 
          m.*,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'avatar', u.avatar
          ) as user,
          array_agg(DISTINCT jsonb_build_object(
            'id', rb.user_id,
            'name', rb_user.name,
            'avatar', rb_user.avatar
          )) as read_by
        FROM messages m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN message_read_by rb ON m.id = rb.message_id
        LEFT JOIN users rb_user ON rb.user_id = rb_user.id
        WHERE m.id = ${messageId}
        GROUP BY m.id, u.id, u.name, u.email, u.avatar
      `;

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({ message: "Error fetching message" });
  }
};
