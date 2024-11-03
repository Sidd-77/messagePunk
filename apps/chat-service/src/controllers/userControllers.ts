import { Request, Response } from "express";
import sql from "../utils/db";
import type { User } from "../utils/db_intialize";

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.body;
    let users;

    if (query) {
      users = await sql`
        SELECT id, name, email, avatar_url, last_seen_at, created_at
        FROM users
        WHERE 
          name ILIKE ${`%${query}%`} OR
          email ILIKE ${`%${query}%`}
      `;
    } else {
      users = await sql`
        SELECT id, name, email, avatar_url, last_seen_at, created_at
        FROM users
      `;
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, name, email, avatar_url = "" }: User = req.body;

    const [user] = await sql`
      INSERT INTO users (id, name, email, avatar_url)
      VALUES (${id}, ${name}, ${email}, ${avatar_url})
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name,
          email = EXCLUDED.email,
          avatar_url = EXCLUDED.avatar_url
      RETURNING *
    `;

    res.status(201).json(user);
  } catch (error) {
    console.error("Create error:", error);
    res.status(400).json({ message: "Error creating user" });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const [user] = await sql`
      SELECT id, name, email, avatar_url, last_seen_at, created_at
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get error:", error);
    res.status(500).json({ message: "Error retrieving user" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, name, email, avatar_url } = req.body;

    const [user] = await sql`
      UPDATE users
      SET 
        name = ${name},
        email = ${email},
        avatar_url = ${avatar_url},
        last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

export const updateLastSeen = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const [user] = await sql`
      UPDATE users
      SET last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING *
    `;

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Update last seen error:", error);
    res.status(500).json({ message: "Error updating last seen" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    await sql.begin(async (sql) => {
      // Delete user's message statuses
      await sql`DELETE FROM message_status WHERE user_id = ${userId}`;

      // Delete messages sent by user (or handle as needed)
      await sql`UPDATE messages SET is_deleted = true WHERE sender_id = ${userId}`;

      // Remove from chat participants
      await sql`DELETE FROM chat_participants WHERE user_id = ${userId}`;

      // Finally delete the user
      const result = await sql`DELETE FROM users WHERE id = ${userId}`;

      if (result.count === 0) {
        res.status(404).json({ message: "User not found" });
        return;
      }
    });

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
