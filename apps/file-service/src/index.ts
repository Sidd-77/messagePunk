// file-service/src/index.ts
import { 
    S3Client, 
    PutObjectCommand, 
    GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import amqp from 'amqplib';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Initialize database
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS file_attachments (
                message_id VARCHAR(255) PRIMARY KEY,
                file_link VARCHAR(1000) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

// S3 Client configuration
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || 'chat-files';

// Helper function to generate presigned URL
async function generatePresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Process file upload
async function processFileUpload(message: any) {
    try {
        const { id, file, chat_id, user_id } = message;
        const fileBuffer = Buffer.from(file.data);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${id}.${fileExtension}`;

        // Upload to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: file.type,
        }));

        // Generate presigned URL
        const fileUrl = await generatePresignedUrl(fileName);

        // Store file information in database
        await pool.query(
            `INSERT INTO file_attachments 
            (message_id, file_link, file_name, file_size, mime_type) 
            VALUES ($1, $2, $3, $4, $5)`,
            [
                id,
                fileUrl,
                file.name,
                file.size,
                file.type
            ]
        );

        // Publish success message to message-updates queue
        const updateMessage = {
            id,
            type: 'file',
            status: 'sent',
            fileUrl,
            fileName: file.name,
            chat_id,
            user_id
        };

        await channel.publish(
            'chat-exchange',
            'message.update',
            Buffer.from(JSON.stringify(updateMessage))
        );

    } catch (error) {
        console.error('Error processing file upload:', error);
        
        // Publish error message to message-updates queue
        const errorMessage = {
            id: message.id,
            type: 'file',
            status: 'error',
            error: 'File upload failed',
            chat_id: message.chat_id,
            user_id: message.user_id
        };

        await channel.publish(
            'chat-exchange',
            'message.update',
            Buffer.from(JSON.stringify(errorMessage))
        );
    }
}

// RabbitMQ setup
let channel: amqp.Channel;

async function setupRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();

        // Setup exchange
        await channel.assertExchange('chat-exchange', 'topic', { durable: true });

        // Setup queues
        await channel.assertQueue('file-uploads', { durable: true });
        await channel.assertQueue('message-updates', { durable: true });

        // Bind queues to exchange
        await channel.bindQueue('file-uploads', 'chat-exchange', 'message.file');
        await channel.bindQueue('message-updates', 'chat-exchange', 'message.update');

        // Consume messages from file-uploads queue
        channel.consume('file-uploads', async (msg) => {
            if (msg) {
                const message = JSON.parse(msg.content.toString());
                await processFileUpload(message);
                channel.ack(msg);
            }
        });

        console.log('RabbitMQ setup completed');
    } catch (error) {
        console.error('RabbitMQ setup error:', error);
        process.exit(1);
    }
}

// Initialize service
async function init() {
    await initializeDatabase();
    await setupRabbitMQ();
    console.log('File service initialized');
}

init();