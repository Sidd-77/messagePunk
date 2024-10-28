import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";

// Load .env file from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const database = process.env.DB_DATABASE;``

// Add validation to ensure all required env variables are present
const validateEnvVariables = () => {
    const required = ['DB_USERNAME', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_DATABASE'];
    const missing = required.filter(name => !process.env[name]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

validateEnvVariables();

const sql = postgres(`postgres://${username}:${password}@${host}:${port}/${database}`);

export default sql;