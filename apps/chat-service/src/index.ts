import express from 'express';
import SocketService from './socket';
import createServer from 'http';

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer.createServer(app);

const socketService = new SocketService();

socketService.io.attach(httpServer)

app.get('/', (req, res) => {
  res.send('Chat service is running');
});

httpServer.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
    console.log(`Socket server is running url: http://localhost:${port}`);
})

