import sql from "./db";

export async function initializeTables() {
  try {
    // Start a transaction
    await sql.begin(async (sql) => {
      console.log("Starting database initialization...");

      // Users table
      await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    avatar VARCHAR(255)
                );
            `;
      await sql`
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            `;
      await sql`
                CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
            `;
      console.log("Users table created.");

      // Chats table
      await sql`
                CREATE TABLE IF NOT EXISTS chats (
                    id VARCHAR(255) PRIMARY KEY,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('personal', 'group')),
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    avatar VARCHAR(255),
                    last_message_id VARCHAR(255)
                );
            `;
      console.log("Chats table created.");

      // Messages table
      await sql`
                CREATE TABLE IF NOT EXISTS messages (
                    id VARCHAR(255) PRIMARY KEY,
                    message TEXT NOT NULL,
                    user_id VARCHAR(255) NOT NULL,
                    chat_id VARCHAR(255) NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'image', 'file', 'system')),
                    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (chat_id) REFERENCES chats(id)
                );

            `;

      await sql`
                CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
            `;
      await sql`
            CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
            `;

      console.log("Messages table created.");

      // Add foreign key constraint for last_message_id after messages table is created
      await sql`
                ALTER TABLE chats
                ADD CONSTRAINT fk_last_message
                FOREIGN KEY (last_message_id) 
                REFERENCES messages(id);
            `;
      console.log("Added last_message foreign key to chats table.");

      await sql`
                CREATE TABLE IF NOT EXISTS files (
                    id VARCHAR(255) PRIMARY KEY,
                    url VARCHAR(255) NOT NULL,
                    FOREIGN KEY (id) REFERENCES messages(id)
                )
            `;

      // Chat members junction table
      await sql`
                CREATE TABLE IF NOT EXISTS chat_members (
                    chat_id VARCHAR(255),
                    user_id VARCHAR(255),
                    PRIMARY KEY (chat_id, user_id),
                    FOREIGN KEY (chat_id) REFERENCES chats(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `;
      console.log("Chat members table created.");

      // Chat admins junction table
      await sql`
                CREATE TABLE IF NOT EXISTS chat_admins (
                    chat_id VARCHAR(255),
                    user_id VARCHAR(255),
                    PRIMARY KEY (chat_id, user_id),
                    FOREIGN KEY (chat_id) REFERENCES chats(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `;
      console.log("Chat admins table created.");

      // Message read status junction table
      await sql`
                CREATE TABLE IF NOT EXISTS message_read_by (
                    message_id VARCHAR(255),
                    user_id VARCHAR(255),
                    PRIMARY KEY (message_id, user_id),
                    FOREIGN KEY (message_id) REFERENCES messages(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `;
      console.log("Message read status table created.");
    });

    console.log("Database initialization completed successfully.");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Function to drop all tables (useful for testing or resetting the database)
export async function dropAllTables() {
  try {
    await sql.begin(async (sql) => {
      console.log("Starting to drop all tables...");

      // Drop tables in correct order due to foreign key constraints
      await sql`DROP TABLE IF EXISTS message_read_by CASCADE;`;
      await sql`DROP TABLE IF EXISTS chat_admins CASCADE;`;
      await sql`DROP TABLE IF EXISTS chat_members CASCADE;`;
      await sql`DROP TABLE IF EXISTS messages CASCADE;`;
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

// Types for your entities
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Chat {
  id: string;
  type: "personal" | "group";
  name: string;
  created_at: Date;
  avatar?: string;
  last_message_id?: string;
}

export interface Message {
  id: string;
  message: string;
  user_id: string;
  chat_id: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "system";
  status: "sent" | "delivered" | "read";
}

async function main() {
  try {
    // Initialize tables
    await initializeTables();
    console.log("Database setup completed");

    // Optionally, to reset the database:
    // await dropAllTables();
    // await initializeTables();
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
