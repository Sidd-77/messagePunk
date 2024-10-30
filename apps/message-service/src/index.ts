import express from 'express';
import SocketService from './socket';
import createServer from 'http';
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

app.get('/', (req, res) => {
  res.send('Message service is running');
});

httpServer.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`Socket server is running url: http://localhost:${port}`);
})

