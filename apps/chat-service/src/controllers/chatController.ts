import { Request, Response } from "express";

import sql from "../utils/db";

export const createChat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id, type, name, members, admin, createdAt } = req.body;

    // Start a transaction
    await sql.begin(async (sql) => {
      // Create the chat
      const [chat] = await sql`
        INSERT INTO chats (id, type, name, created_at)
        VALUES (${id}, ${type}, ${name}, ${createdAt})
        RETURNING *
      `;

      // Add members
      if (members && members.length > 0) {
        await sql`
          INSERT INTO chat_members (chat_id, user_id)
          SELECT ${chat.id}, unnest(${members}::varchar[])
        `;
      }

      // Add admins
      if (admin && admin.length > 0) {
        await sql`
          INSERT INTO chat_admins (chat_id, user_id)
          SELECT ${chat.id}, unnest(${admin}::varchar[])
        `;
      }

      // Get the complete chat data with members and admins
      const [completeChat] = await sql`
        SELECT 
          c.*,
          array_agg(DISTINCT m.user_id) as members,
          array_agg(DISTINCT a.user_id) as admins
        FROM chats c
        LEFT JOIN chat_members m ON c.id = m.chat_id
        LEFT JOIN chat_admins a ON c.id = a.chat_id
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
  res: Response,
): Promise<void> => {
  const { chatId } = req.body;
  try {
    // Query to get chat info from chatId
    const [chat] = await sql`
      SELECT 
        c.*,
        array_agg(DISTINCT m.user_id) as members,
        array_agg(DISTINCT a.user_id) as admins
      FROM chats c
      LEFT JOIN chat_members m ON c.id = m.chat_id
      LEFT JOIN chat_admins a ON c.id = a.chat_id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

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

export const getChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const chats = await sql`
      WITH user_chats AS (
        SELECT DISTINCT c.*
        FROM chats c
        JOIN chat_members cm ON c.id = cm.chat_id
        WHERE cm.user_id = ${userId}
      )
      SELECT 
        uc.id,
        uc.type,
        uc.name,
        uc.created_at,
        uc.avatar,
        uc.last_message_id,
        array_agg(DISTINCT cm.user_id) as members,
        array_agg(DISTINCT ca.user_id) as admins,
        CASE 
          WHEN m.id IS NOT NULL THEN
            json_build_object(
              'id', m.id,
              'message', m.message,
              'timestamp', m.timestamp,
              'user_id', m.user_id
            )
          ELSE NULL
        END as last_message,
        COALESCE(
          json_agg(
            json_build_object(
              'id', other_users.id,
              'name', other_users.name,
              'email', other_users.email,
              'avatar', other_users.avatar
            )
          ) FILTER (WHERE other_users.id IS NOT NULL AND other_users.id != ${userId}),
          '[]'::json
        ) as other_members,
        json_build_object(
          'id', curr.id,
          'name', curr.name,
          'email', curr.email,
          'avatar', curr.avatar
        ) as current_user
      FROM user_chats uc
      JOIN chat_members cm ON uc.id = cm.chat_id
      LEFT JOIN chat_admins ca ON uc.id = ca.chat_id
      LEFT JOIN messages m ON uc.last_message_id = m.id
      LEFT JOIN users other_users ON cm.user_id = other_users.id
      LEFT JOIN users curr ON curr.id = ${userId}
      GROUP BY 
        uc.id,
        uc.type,
        uc.name,
        uc.created_at,
        uc.avatar,
        uc.last_message_id,
        m.id,
        m.message,
        m.timestamp,
        m.user_id,
        curr.id,
        curr.name,
        curr.email,
        curr.avatar
      ORDER BY m.timestamp DESC NULLS LAST
    `;

    res.status(200).json(chats);
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ message: "Error fetching chats" });
  }
};

// export const getChatInfo = async (req: Request, res: Response):Promise<any> => {
//   try {
//     const chat = await Chat.findOne({ id: req.body.chatId })
//     .populate('members')
//     .populate('lastMessage')
//     .populate('admin');
//     if (!chat) {
//       return res.status(404).send({ message: "Chat not found" });
//     }
//     res.status(200).send(chat);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { chatId, member } = req.body;

    await sql`
      INSERT INTO chat_members (chat_id, user_id)
      VALUES (${chatId}, ${member})
      ON CONFLICT DO NOTHING
    `;

    const [chat] = await sql`
      SELECT 
        c.*,
        array_agg(DISTINCT cm.user_id) as members
      FROM chats c
      LEFT JOIN chat_members cm ON c.id = cm.chat_id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ message: "Error adding member" });
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { chatId, member } = req.body;

    await sql`
      DELETE FROM chat_members
      WHERE chat_id = ${chatId} AND user_id = ${member}
    `;

    const [chat] = await sql`
      SELECT 
        c.*,
        array_agg(DISTINCT cm.user_id) as members
      FROM chats c
      LEFT JOIN chat_members cm ON c.id = cm.chat_id
      WHERE c.id = ${chatId}
      GROUP BY c.id
    `;

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Error removing member" });
  }
};

export const deleteChat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { chatId } = req.body;
    console.log("Delete chat:", chatId);
    await sql.begin(async (sql) => {
      // Delete all related records first
      await sql`DELETE FROM chat_members WHERE chat_id = ${chatId}`;
      await sql`DELETE FROM chat_admins WHERE chat_id = ${chatId}`;
      await sql`DELETE FROM message_read_by WHERE message_id IN (
        SELECT id FROM messages WHERE chat_id = ${chatId}
      )`;
      await sql`DELETE FROM messages WHERE chat_id = ${chatId}`;
      await sql`DELETE FROM chats WHERE id = ${chatId}`;
    });

    res.status(200).json({ message: "Chat deleted" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ message: "Error deleting chat" });
  }
};

export const renameChat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { chatId, name } = req.body;

    const [chat] = await sql`
      UPDATE chats
      SET name = ${name}
      WHERE id = ${chatId}
      RETURNING *
    `;

    if (!chat) {
      res.status(404).json({ message: "Chat not found" });
      return;
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Rename chat error:", error);
    res.status(500).json({ message: "Error renaming chat" });
  }
};
