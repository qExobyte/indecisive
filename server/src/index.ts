import express from 'express';
import {createServer} from 'http';
import {Server, Socket} from 'socket.io'; // server is a class
import cors from 'cors';

// creates app and server
const app = express();
const server = createServer(app);

interface RoomData {
    player_set: Set<string>;  // set of usernames (could make player object w/ id, username, etc.)
    can_join: boolean;
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
       // check for blank/whitespace username
       if (!username.trim()) {
            socket.emit("fail_to_create_room");
       }
       else {
           console.log(`Creating room ${roomCounter}`);
           rooms[String(roomCounter)] = {
               player_set: new Set<string>([username]),
               can_join: true
           };
           let roomID = String(roomCounter);
           socket.join(roomID);
           socket.emit("room_created", roomID);
           socket.emit("update_player_list", Array.from(rooms[roomID].player_set));
           roomCounter++;
       }
   });

   socket.on("attempt_join_room", (room, username) => {
       if ((room in rooms) && rooms[room].can_join) {
           rooms[room].player_set.add(username);
           socket.join(room);
           socket.emit("send_to_room", room);
           // io.to(room) doesn't ensure that the player is in the room before running so it may cause problems
           // therefore, run socket.emit for player and io.to(room) for players already in room
           socket.emit("update_player_list", Array.from(rooms[room].player_set));
           io.to(room).emit("update_player_list", Array.from(rooms[room].player_set));
       }
       else {
           const error_msg = "Invalid room code";
           socket.emit("fail_to_join_room", error_msg);
       }
   });

   socket.on("leave_room", (room, username) => {
       socket.leave(room);
       rooms[room].player_set.delete(username);
       console.log(Array.from(rooms[room].player_set));
       io.to(room).emit("update_player_list", Array.from(rooms[room].player_set));
   })

   // listen for send_msg event, then pass the emitted data into this callback function
   socket.on("send_msg", (data) => {
        socket.to(data.room).emit("receive_msg", data);
   });

   socket.on("get_player_list", (roomID: string) => {
       let playerList = rooms[roomID].player_set;
       socket.emit("update_player_list", Array.from(playerList));
   });

   socket.on("disconnect", () => {
       console.log(`User disconnected: ${socket.id}`);
   });
});


// running backend on port 3000 TODO is this necessary?
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

