import express from 'express';
import {createServer} from 'http';
import {Server, Socket} from 'socket.io'; // server is a class
import cors from 'cors';

// creates app and server
const app = express();
const server = createServer(app);

interface RoomData {
    player_set: Set<string>;  // set of usernames (could make player object w/ id, username, etc.)
}

// roomID --> roomData
let rooms: {[key: string] : RoomData} = {};
let roomCounter = 1000;

app.use(cors());
const io = new Server(server, {
    // cors (cross origin resource sharing) middleware tells browser to allow communication between client & server
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// .on listens for an event
// connection event occurs when user connects to server
io.on("connection", (socket: Socket) => {
   console.log(`user is in da house: ${socket.id}`);

   socket.on("create_room", (username: string) => {
       console.log(`Creating room ${roomCounter}`);
       rooms[String(roomCounter)] = {
           player_set: new Set<string>([username])
       };
       socket.join(String(roomCounter));
       socket.emit("room_created", roomCounter);
       roomCounter++;
   });

   socket.on("attempt_join_room", (room, username) => {
       // TODO see if room already started - give roomData boolean flag
       console.log("room", room);
       console.log(rooms[room]);
       console.log(rooms[room].player_set);
       rooms[room].player_set.add(username);
       socket.emit("send_to_room", room, username);
       io.to(room).emit("update_player_list", Array.from(rooms[room].player_set));
   });

   socket.on("leave_room", (room, username) => {
       socket.leave(room);
       rooms[room].player_set.delete(username);
   })

   // listen for send_msg event, then pass the emitted data into this callback function
   socket.on("send_msg", (data) => {
        socket.to(data.room).emit("receive_msg", data);
   });

   socket.on("get_player_list", (roomID: string) => {
       console.log(`room ID: ${roomID}`);
       let playerList = rooms[roomID].player_set;
       console.log(`player list: ${playerList}`);
       socket.emit("update_player_list", Array.from(playerList));
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


