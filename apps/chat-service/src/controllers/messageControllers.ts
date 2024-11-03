import { Request, Response } from "express";
import sql from "../utils/db";
import type { Message, MessageStatus } from "../utils/db_intialize";

export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chat_id, sender_id, content=null, type, file_url=null, file_name=null } = req.body;
    console.log(req.body);

    await sql.begin(async (sql) => {
      // Create the message
      const [message] = await sql`
        INSERT INTO messages (
          chat_id,
          sender_id,
          content,
          type,
          file_url,
          file_name
        )
        VALUES (
          ${chat_id},
          ${sender_id},
          ${content},
          ${type},
          ${file_url},
          ${file_name}
        )
        RETURNING *
      `;

      // Get all chat participants except sender for message status
      const participants = await sql`
        SELECT user_id
        FROM chat_participants
        WHERE chat_id = ${chat_id}
        AND user_id != ${sender_id}
      `;

      // Create message status entries for all participants
      if (participants.length > 0) {
        await sql`
          INSERT INTO message_status (message_id, user_id, is_read, read_at)
          SELECT ${message.id}, user_id, false, null
          FROM chat_participants
          WHERE chat_id = ${chat_id}
          AND user_id != ${sender_id}
        `;
      }

      // Return message with sender info
      const [completeMessage] = await sql`
        SELECT 
          m.*,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar_url', u.avatar_url
          ) as sender,
          COALESCE(
            json_agg(
              json_build_object(
                'user_id', ms.user_id,
                'is_read', ms.is_read,
                'read_at', ms.read_at
              )
            ) FILTER (WHERE ms.user_id IS NOT NULL),
            '[]'::json
          ) as read_status
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        LEFT JOIN message_status ms ON m.id = ms.message_id
        WHERE m.id = ${message.id}
        GROUP BY m.id, u.id, u.name, u.avatar_url
      `;

      res.status(201).json(completeMessage);
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Error sending message" });
  }
};

export const getChatMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId } = req.body;

    const messages = await sql`
      SELECT 
        m.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as sender,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', ms.user_id,
              'is_read', ms.is_read,
              'read_at', ms.read_at
            )
          ) FILTER (WHERE ms.user_id IS NOT NULL),
          '[]'
        ) as read_status
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_status ms ON m.id = ms.message_id
      WHERE m.chat_id = ${chatId}
        AND NOT m.is_deleted
      GROUP BY m.id, u.id, u.name, u.avatar_url, m.created_at
      ORDER BY m.created_at DESC
    `;

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get chat messages error:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
};

export const markMessageAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId, userId } = req.body;

    await sql`
      INSERT INTO message_status (message_id, user_id, is_read, read_at)
      VALUES (${messageId}, ${userId}, true, CURRENT_TIMESTAMP)
      ON CONFLICT (message_id, user_id)
      DO UPDATE SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP
    `;

    // Update last read message in chat_participants
    await sql`
      UPDATE chat_participants cp
      SET last_read_message_id = ${messageId}
      FROM messages m
      WHERE m.id = ${messageId}
      AND cp.chat_id = m.chat_id
      AND cp.user_id = ${userId}
    `;

    const [messageStatus] = await sql`
      SELECT 
        m.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as sender,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', ms.user_id,
              'is_read', ms.is_read,
              'read_at', ms.read_at
            )
          ) FILTER (WHERE ms.user_id IS NOT NULL),
          '[]'::json
        ) as read_status
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_status ms ON m.id = ms.message_id
      WHERE m.id = ${messageId}
      GROUP BY m.id, u.id, u.name, u.avatar_url
    `;

    res.status(200).json(messageStatus);
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({ message: "Error marking message as read" });
  }
};

export const markChatMessagesAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { chatId, userId } = req.body;

    await sql.begin(async (sql) => {
      // Get the latest message in the chat
      const [latestMessage] = await sql`
        SELECT id
        FROM messages
        WHERE chat_id = ${chatId}
        AND NOT is_deleted
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (latestMessage) {
        // Mark all unread messages as read
        await sql`
          INSERT INTO message_status (message_id, user_id, is_read, read_at)
          SELECT m.id, ${userId}, true, CURRENT_TIMESTAMP
          FROM messages m
          LEFT JOIN message_status ms ON 
            ms.message_id = m.id AND 
            ms.user_id = ${userId}
          WHERE m.chat_id = ${chatId}
          AND NOT m.is_deleted
          AND (ms.is_read IS NULL OR NOT ms.is_read)
          ON CONFLICT (message_id, user_id)
          DO UPDATE SET 
            is_read = true,
            read_at = CURRENT_TIMESTAMP
        `;

        // Update last read message in chat_participants
        await sql`
          UPDATE chat_participants
          SET last_read_message_id = ${latestMessage.id}
          WHERE chat_id = ${chatId}
          AND user_id = ${userId}
        `;
      }
    });

    res.status(200).json({ message: "All messages marked as read" });
  } catch (error) {
    console.error("Mark chat messages as read error:", error);
    res.status(500).json({ message: "Error marking messages as read" });
  }
};

export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.body;

    await sql.begin(async (sql) => {
      // Soft delete the message
      const [message] = await sql`
        UPDATE messages
        SET is_deleted = true
        WHERE id = ${messageId}
        RETURNING *
      `;

      if (!message) {
        res.status(404).json({ message: "Message not found" });
        return;
      }

      // Delete message status entries
      await sql`
        DELETE FROM message_status
        WHERE message_id = ${messageId}
      `;

      // Update last_read_message_id in chat_participants if necessary
      await sql`
        UPDATE chat_participants cp
        SET last_read_message_id = (
          SELECT id
          FROM messages
          WHERE chat_id = ${message.chat_id}
          AND NOT is_deleted
          AND created_at < (SELECT created_at FROM messages WHERE id = ${messageId})
          ORDER BY created_at DESC
          LIMIT 1
        )
        WHERE cp.last_read_message_id = ${messageId}
      `;
    });

    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Error deleting message" });
  }
};

export const updateMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { messageId } = req.body;
    const { content } = req.body;

    const [message] = await sql`
      UPDATE messages
      SET 
        content = ${content},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${messageId}
      AND NOT is_deleted
      RETURNING *
    `;

    if (!message) {
      res.status(404).json({ message: "Message not found or already deleted" });
      return;
    }

    // Get complete message data
    const [completeMessage] = await sql`
      SELECT 
        m.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as sender,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', ms.user_id,
              'is_read', ms.is_read,
              'read_at', ms.read_at
            )
          ) FILTER (WHERE ms.user_id IS NOT NULL),
          '[]'::json
        ) as read_status
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN message_status ms ON m.id = ms.message_id
      WHERE m.id = ${messageId}
      GROUP BY m.id, u.id, u.name, u.avatar_url
    `;

    res.status(200).json(completeMessage);
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({ message: "Error updating message" });
  }
};

export const getUnreadMessageCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const unreadCounts = await sql`
      SELECT 
        m.chat_id,
        COUNT(*) as unread_count
      FROM messages m
      LEFT JOIN message_status ms ON 
        ms.message_id = m.id AND 
        ms.user_id = ${userId}
      JOIN chat_participants cp ON 
        cp.chat_id = m.chat_id AND 
        cp.user_id = ${userId}
      WHERE 
        NOT m.is_deleted AND
        m.sender_id != ${userId} AND
        (ms.is_read IS NULL OR NOT ms.is_read)
      GROUP BY m.chat_id
    `;

    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Error getting unread message count" });
  }
};