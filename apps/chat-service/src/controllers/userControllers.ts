import { Request, Response } from "express";
import sql from "../utils/db";

export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { query } = req.body;
    let users;

    if (query) {
      users = await sql`
        SELECT id, name, email, avatar
        FROM users
        WHERE 
          name ILIKE ${`%${query}%`} OR
          email ILIKE ${`%${query}%`}
      `;
    } else {
      users = await sql`
        SELECT id, name, email, avatar
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
  res: Response,
): Promise<void> => {
  try {
    const { id, name, email, avatar } = req.body;

    const [user] = await sql`
      INSERT INTO users (id, name, email, avatar)
      VALUES (${id}, ${name}, ${email}, ${avatar})
      ON CONFLICT (id) DO UPDATE 
      SET name = EXCLUDED.name,
          email = EXCLUDED.email,
          avatar = EXCLUDED.avatar
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
            SELECT id, name, email, avatar
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
  res: Response,
): Promise<void> => {
  try {
    const { id, name, email, avatar } = req.body;

    const [user] = await sql`
            UPDATE users
            SET 
                name = ${name},
                email = ${email},
                avatar = ${avatar},
                updated_at = CURRENT_TIMESTAMP
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

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.body;

    const result = await sql`
            DELETE FROM users
            WHERE id = ${userId}
        `;

    if (result.count === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
