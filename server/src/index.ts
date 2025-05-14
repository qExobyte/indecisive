import express from 'express';
import { createServer } from 'http';
import {Server, Socket} from 'socket.io';  // server is a class
import cors from 'cors';

// creates app and server
const app = express();
const server = createServer(app);

app.use(cors());
const io = new Server(server, {
    // cors (cross origin resource sharing) middleware tells browser to allow communication between client & server
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// .on listens for an event
// connection event occurs when user connects to server
io.on("connection", (socket: Socket) => {
   console.log(`user is in da house: ${socket.id}`);

   socket.on("join_room", (data) => {
       socket.join(data.room);
   });

   // listen for send_msg event, then pass the emitted data into this callback function
   socket.on("send_msg", (data) => {
        socket.to(data.room).emit("receive_msg", data);
   });
});

// running backend on port 3001
server.listen(3001, () => {
    console.log("server is running, poggers");
})

