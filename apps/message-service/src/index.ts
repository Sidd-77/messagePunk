import express from 'express';
import SocketService from './socket';
import createServer from 'http';
import { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer.createServer(app);

app.use(cors({
    origin: process.env.ORIGIN || '*'
}));

const socketService = new SocketService();

socketService.io.attach(httpServer)

// heatlh check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: Date.now(), service: 'message-service' });
});

app.get('/', (req, res) => {
  res.send('Message service is running');
});

httpServer.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`Socket server is running url: http://localhost:${port}`);
})

