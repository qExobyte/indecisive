import express from 'express';
import { createServer } from 'http';
import {Server, Socket} from 'socket.io';  // server is a class
import cors from 'cors';

// creates app and server
const app = express();
const server = createServer(app);

interface RoomData {
    player_list: string[];  // list of usernames (could make player object w/ id, username, etc.)
}

// roomID --> roomData
let rooms: {[key: string] : RoomData} = {};
let roomCounter = 1000;

app.use(cors());
const io = new Server(server, {
    // cors (cross origin resource sharing) middleware tells browser to allow communication between client & server
    cors: {
        origin: 'http://localhost:5175',
        methods: ['GET', 'POST']
    }
});

// .on listens for an event
// connection event occurs when user connects to server
io.on("connection", (socket: Socket) => {
   console.log(`user is in da house: ${socket.id}`);

   socket.on("create_room", (username: string) => {
       console.log(`Creating room ${roomCounter}`);
       const room_data : RoomData = {
           player_list: [username]
       }
       socket.join(String(roomCounter));
       rooms[roomCounter] = room_data;
       socket.emit("room_created", roomCounter);
       roomCounter++;
   });

   socket.on("join_room", (room) => {
       socket.join(room);
   });

   // listen for send_msg event, then pass the emitted data into this callback function
   socket.on("send_msg", (data) => {
        socket.to(data.room).emit("receive_msg", data);
   });

   socket.on("get_player_list", (roomID: string) => {
       console.log(`room ID: ${roomID}`);
       let playerList = rooms[roomID].player_list;
       console.log(`player list: ${playerList}`);
       socket.emit("update_player_list", playerList);
   });

   socket.on("disconnect", () => {
       console.log(`User disconnected: ${socket.id}`);
   });
});


// running backend on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// // Gracefully close server on CTRL+C or reload
// process.on('SIGINT', () => {
//     console.log('Shutting down server...');
//     server.close(() => {
//         console.log('Server closed.');
//         process.exit(0);
//     });
// });


