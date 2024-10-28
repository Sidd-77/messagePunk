import { Request, Response } from "express";

import sql from "../utils/db";

export const createChat = async (
  req: Request,
  res: Response
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



export const getChats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const chats = await sql`
      SELECT 
        c.*,
        array_agg(DISTINCT cm.user_id) as members,
        array_agg(DISTINCT ca.user_id) as admins,
        json_build_object(
          'id', m.id,
          'message', m.message,
          'timestamp', m.timestamp
        ) as last_message,
        json_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        )) as member_details
      FROM chats c
      JOIN chat_members cm ON c.id = cm.chat_id
      LEFT JOIN chat_admins ca ON c.id = ca.chat_id
      LEFT JOIN messages m ON c.last_message_id = m.id
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.user_id = ${userId}
      GROUP BY c.id, m.id
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

export const addMember = async (
  req: Request,
  res: Response
): Promise<void> => {
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
  res: Response
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
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.body;

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
  res: Response
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

