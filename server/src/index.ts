import express from 'express';
import {createServer} from 'http';
import {Server, Socket} from 'socket.io'; // server is a class
import cors from 'cors';

// creates app and server
const app = express();
const server = createServer(app);

interface Player {
    username: string;
    isHost: boolean;
    roomID?: string; // ? means can be undefined
}

interface RoomData {
    player_IDs: string[];  // set of player IDs (then use lookup table)
    can_join: boolean;
}

// roomID --> roomData
const room_dict: {[key: string] : RoomData} = {};
let roomCounter = 1000;

const player_dict: {[key: string] : Player} = {};

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
   player_dict[socket.id] = {
       username: "",
       isHost: false,
       roomID: undefined
   }

   function updatePlayerList(roomID: string) {
       const username_list = room_dict[roomID].player_IDs.map(
            pid => player_dict[pid].username
       );
       socket.emit("update_player_list", username_list);
       io.to(roomID).emit("update_player_list", username_list);
   }

   function removePlayerFromRoom(roomID: string) {
       room_dict[roomID].player_IDs = room_dict[roomID].player_IDs.filter(id => id !== socket.id);
   }

   socket.on("create_room", (username: string) => {
       // check for blank/whitespace username
       if (!username.trim()) {
            socket.emit("fail_to_create_room");
       }
       else {
           console.log(`Creating room ${roomCounter}`);
           const roomID = String(roomCounter);
           socket.join(roomID);
           player_dict[socket.id].username = username;
           player_dict[socket.id].roomID = roomID;

           room_dict[roomID] = {
               player_IDs: [socket.id],
               can_join: true
           };

           socket.emit("room_created", roomID);
           updatePlayerList(roomID);
           roomCounter++;
       }
   });

   socket.on("attempt_join_room", (roomID, username) => {
       console.log(`Attempting to join room ${roomID}`);
       if ((roomID in room_dict) && room_dict[roomID].can_join) {
           // strange but simple to do here
           socket.join(roomID);
           player_dict[socket.id].username = username;
           player_dict[socket.id].roomID = roomID;

           room_dict[roomID].player_IDs.push(socket.id);
           console.log(room_dict[roomID].player_IDs);
           console.log(player_dict[socket.id]);
           socket.emit("send_to_room", roomID);
           // io.to(room) doesn't ensure that the player is in the room before running so it may cause problems
           // therefore, run socket.emit for player and io.to(room) for players already in room
           updatePlayerList(roomID);
       }
       else {
           const error_msg = "Invalid room code";
           socket.emit("fail_to_join_room", error_msg);
       }
   });

   socket.on("leave_room", (roomID) => {
       socket.leave(roomID);
       removePlayerFromRoom(roomID);
       console.log(room_dict[roomID].player_IDs);
       updatePlayerList(roomID);
   })

   socket.on("get_player_list", (roomID: string) => {
       updatePlayerList(roomID);
   });

   socket.on("disconnect", () => {
       console.log(`User disconnected: ${socket.id}`);
       const player_room = player_dict[socket.id].roomID;
       console.log(`Disconnecting and room: ${player_room}`);
       delete player_dict[socket.id];
       if (player_room) {
           removePlayerFromRoom(player_room);
           updatePlayerList(player_room);
       }
   });
});


// running backend on port 3000 TODO is this necessary?
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

