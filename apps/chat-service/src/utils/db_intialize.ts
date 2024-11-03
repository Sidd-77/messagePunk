import sql from "./db";

export async function initializeTables() {
  try {
    await sql.begin(async (sql) => {
      console.log("Starting database initialization...");

      // Users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          avatar_url VARCHAR(255),
          last_seen_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Chats table
      await sql`
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
          name VARCHAR(100),
          avatar_url VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL
        );
      `;

      // Messages table
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          sender_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
          content TEXT,
          type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'file')),
          file_url VARCHAR(255),
          file_name VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_deleted BOOLEAN DEFAULT false
        );
      `;

      // Chat participants
      await sql`
        CREATE TABLE IF NOT EXISTS chat_participants (
          chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
          last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
          PRIMARY KEY (chat_id, user_id)
        );
      `;

      

      // Message status table
      await sql`
        CREATE TABLE IF NOT EXISTS message_status (
          message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT false,
          read_at TIMESTAMP WITH TIME ZONE,
          PRIMARY KEY (message_id, user_id)
        );
      `;

      // Create necessary indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);`;

      console.log("Database initialization completed successfully.");
    });
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export async function dropAllTables() {
  try {
    await sql.begin(async (sql) => {
      console.log("Starting to drop all tables...");

      await sql`DROP TABLE IF EXISTS message_status CASCADE;`;
      await sql`DROP TABLE IF EXISTS messages CASCADE;`;
      await sql`DROP TABLE IF EXISTS chat_participants CASCADE;`;
      await sql`DROP TABLE IF EXISTS chats CASCADE;`;
      await sql`DROP TABLE IF EXISTS users CASCADE;`;

      console.log("All tables dropped successfully.");
    });
    return true;
  } catch (error) {
    console.error("Error dropping tables:", error);
    throw error;
  }
}

export interface User {
  id: string; // Clerk user ID
  name: string;
  email: string;
  avatar_url?: string;
  last_seen_at?: Date;
  created_at: Date;
}

export interface Chat {
  id: string;
  type: "direct" | "group";
  name?: string;
  avatar_url?: string;
  created_at: Date;
  created_by?: string;
}

export interface ChatParticipant {
  chat_id: string;
  user_id: string;
  role: "owner" | "member";
  last_read_message_id?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string;
  type: "text" | "file";
  file_url?: string;
  file_name?: string;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface MessageStatus {
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at?: Date;
}
