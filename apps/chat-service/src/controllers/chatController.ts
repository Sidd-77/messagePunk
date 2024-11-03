import { Request, Response } from "express";
import sql from "../utils/db";
import type { Chat } from "../utils/db_intialize";

export const createChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, name, avatar_url, created_by, participants } = req.body;

    await sql.begin(async (sql) => {
      // Create the chat
      const [chat] = await sql`
        INSERT INTO chats (type, name, avatar_url, created_by)
        VALUES (${type}, ${name}, ${avatar_url}, ${created_by})
        RETURNING *
      `;

      // Add participants
      if (participants && participants.length > 0) {
        participants.forEach(async (participant: any) => {
          await sql`
            INSERT INTO chat_participants (chat_id, user_id, role)
            VALUES (${chat.id}, ${participant.user_id}, ${participant.role})
          `;
        });
      }

      // Get complete chat data
      const [completeChat] = await sql`
        SELECT 
          c.*,
          json_agg(
            json_build_object(
              'user_id', cp.user_id,
              'role', cp.role,
              'last_read_message_id', cp.last_read_message_id
            )
          ) as participants
        FROM chats c
        LEFT JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE c.id = ${chat.id}
        GROUP BY c.id
      `;

      res.status(201).json(completeChat);
    });
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(400).json({ message: "Error creating chat" });
  }
};

export const getChatInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.body;

    const [chat] = await sql`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'last_read_message_id', cp.last_read_message_id,
            'user', json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'avatar_url', u.avatar_url
            )
          )
        ) as participants
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp.chat_id
      LEFT JOIN users u ON cp.user_id = u.id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

    console.log("Chat info:", chat);

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Get chat info error:", error);
    res.status(500).json({ message: "Error fetching chat info" });
  }
};

export const getUserChats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const chats = await sql`
      WITH user_chats AS (
        SELECT c.*, cp.role, cp.last_read_message_id
        FROM chats c
        JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = ${userId}
      )
      SELECT 
        uc.*,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'type', m.type,
            'created_at', m.created_at,
            'sender', json_build_object(
              'id', u.id,
              'name', u.name,
              'avatar_url', u.avatar_url
            )
          )
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.chat_id = uc.id
          AND NOT m.is_deleted
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        json_agg(
          json_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'user', json_build_object(
              'id', u.id,
              'name', u.name,
              'avatar_url', u.avatar_url
            )
          )
        ) as participants
      FROM user_chats uc
      JOIN chat_participants cp ON uc.id = cp.chat_id
      JOIN users u ON cp.user_id = u.id
      GROUP BY uc.id, uc.type, uc.name, uc.created_at, uc.avatar_url, 
               uc.created_by, uc.role, uc.last_read_message_id
      ORDER BY (
        SELECT MAX(created_at) 
        FROM messages 
        WHERE chat_id = uc.id AND NOT is_deleted
      ) DESC NULLS LAST
    `;

    res.status(200).json(chats);
  } catch (error) {
    console.error("Get user chats error:", error);
    res.status(500).json({ message: "Error fetching user chats" });
  }
};

export const updateChatParticipant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId, userId, role } = req.body;

    const [participant] = await sql`
      UPDATE chat_participants
      SET role = ${role}
      WHERE chat_id = ${chatId} AND user_id = ${userId}
      RETURNING *
    `;

    if (!participant) {
      res.status(404).json({ message: "Chat participant not found" });
      return;
    }

    res.status(200).json(participant);
  } catch (error) {
    console.error("Update chat participant error:", error);
    res.status(500).json({ message: "Error updating chat participant" });
  }
};

export const addParticipant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId, userId, role = "member" } = req.body;

    await sql`
      INSERT INTO chat_participants (chat_id, user_id, role)
      VALUES (${chatId}, ${userId}, ${role})
      ON CONFLICT (chat_id, user_id) DO NOTHING
    `;

    const [chat] = await sql`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'last_read_message_id', cp.last_read_message_id
          )
        ) as participants
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

    res.status(200).json(chat);
  } catch (error) {
    console.error("Add participant error:", error);
    res.status(500).json({ message: "Error adding participant" });
  }
};

export const removeParticipant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId, userId } = req.body;

    await sql`
      DELETE FROM chat_participants
      WHERE chat_id = ${chatId} AND user_id = ${userId}
    `;

    const [chat] = await sql`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'last_read_message_id', cp.last_read_message_id
          )
        ) as participants
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

    res.status(200).json(chat);
  } catch (error) {
    console.error("Remove participant error:", error);
    res.status(500).json({ message: "Error removing participant" });
  }
};

export const deleteChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.body;

    await sql.begin(async (sql) => {
      // Delete message statuses
      await sql`DELETE FROM message_status WHERE message_id IN (
        SELECT id FROM messages WHERE chat_id = ${chatId}
      )`;

      // Delete messages
      await sql`DELETE FROM messages WHERE chat_id = ${chatId}`;

      // Delete chat participants
      await sql`DELETE FROM chat_participants WHERE chat_id = ${chatId}`;

      // Delete chat
      const result = await sql`DELETE FROM chats WHERE id = ${chatId}`;

      if (result.count === 0) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }
    });

    res.status(200).json({ message: "Chat deleted" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ message: "Error deleting chat" });
  }
};

export const updateChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.body;
    const { name, avatar_url } = req.body;

    const [chat] = await sql`
      UPDATE chats
      SET 
        name = COALESCE(${name}, name),
        avatar_url = COALESCE(${avatar_url}, avatar_url)
      WHERE id = ${chatId}
      RETURNING
        id,
        type,
        name,
        avatar_url,
        created_at,
        created_by
    `;

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    const [updatedChat] = await sql`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'user_id', cp.user_id,
            'role', cp.role,
            'last_read_message_id', cp.last_read_message_id
          )
        ) as participants
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp.chat_id
      WHERE c.id = ${chat.id}
      GROUP BY c.id
    `;

    res.status(200).json(updatedChat);
  } catch (error) {
    console.error("Update chat error:", error);
    res.status(500).json({ message: "Error updating chat" });
  }
};
