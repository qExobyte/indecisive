import express from 'express';
import {createServer} from 'http';
import {Server, Socket} from 'socket.io'; // server is a class
import cors from 'cors';
import {randomUUID} from "node:crypto";

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
    ideas_list: string[];
    expected_idea_responses: number;
}

// roomID --> roomData
const room_dict: {[key: string] : RoomData} = {};
let roomCounter = 1000;

// key: roomID -> val: {timerID, timerCount}
const timers: {[key: string] : {timerID: NodeJS.Timeout | number | undefined | string, timerCount: number}} = {};
const TIMER_COUNT = 15;

const player_dict: {[key: string] : Player} = {};

app.use(cors());
const io = new Server(server, {
    // cors (cross origin resource sharing) middleware tells browser to allow communication between client & server
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// map: session id --> player id, since session id preserves on refresh
const session_ids_to_player_ids: {[key: string] : string} = {};

declare module "socket.io" {
    interface Socket {
        sessionID: string;
    }
}

// io.use is a middleware function (mediator between server & client)
// client initiates connection --> io.use is triggered --> "connection" is triggered

io.use((socket, next) => {
    // this gets the sessionID held in session storage from auth in App.tsx
    const sessionID = socket.handshake.auth.sessionID;
    console.log(`---------------\nsessionID: ${sessionID}`);
    // console.log(session_ids_to_player_ids);
    // if already stored (meaning this is a reconnect)
    if (sessionID && sessionID in session_ids_to_player_ids) {
        const oldPID = session_ids_to_player_ids[sessionID];
        player_dict[socket.id] = player_dict[oldPID];  // copy contents from oldPID to newPID
        console.log(`Current id: ${socket.id}`);
        console.log(`Player dict: ${JSON.stringify(player_dict, null, 2)}`)
        // update the room to replace the old pid with the new pid
        if (player_dict[oldPID].roomID) {
            const old_roomID = player_dict[oldPID].roomID
            const index = room_dict[old_roomID].player_IDs.indexOf(oldPID);
            room_dict[old_roomID].player_IDs[index] = socket.id;
            socket.join(old_roomID);
            // console.log(`so now room dict is ${JSON.stringify(room_dict, null, 2)}`)
        }
        delete player_dict[oldPID];
        delete session_ids_to_player_ids[sessionID];
        socket.sessionID = sessionID;
    }
    else {
        const newSessionID = randomUUID();
        // console.log(`getting newID: ${newSessionID}`);
        socket.sessionID = newSessionID;
    }
    session_ids_to_player_ids[socket.sessionID] = socket.id;
    return next();
});

// .on listens for an event
// connection event occurs when user connects to server
io.on("connection", (socket: Socket) => {
   console.log(`New connection: ${socket.id}`);

   // console.log(`sending ${socket.sessionID} to client`);
   if (socket.sessionID) socket.emit("session", socket.sessionID);

   // because we might be reconnecting
    if (!player_dict[socket.id]) {
        console.log("Should NOT print on refresh");
        player_dict[socket.id] = {
            username: "",
            isHost: false,
            roomID: undefined
        };
    }
    else {
        const roomID = player_dict[socket.id].roomID;
        if (roomID) {
            updatePlayerList(roomID);
        }
    }

    function updatePlayerList(roomID: string) {
        if (!roomID) return;
        console.log(`-----------Updating player list: ${JSON.stringify(room_dict)}`)
        const username_list = room_dict[roomID].player_IDs.map(
            pid => player_dict[pid].username
        );
        socket.emit("update_player_list", username_list);
        console.log(`room ${roomID} clients: ${room_dict[roomID].player_IDs} for clients in ${JSON.stringify(room_dict,null,2)}`);
        io.to(roomID).emit("update_player_list", username_list);
    }

    function removePlayerFromRoom(roomID: string) {
        if (!roomID) return;
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
               can_join: true,
               ideas_list: [],
               expected_idea_responses: 0
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
           // console.log(room_dict[roomID].player_IDs);
           // console.log(player_dict[socket.id]);
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
       // console.log(room_dict[roomID].player_IDs);
       updatePlayerList(roomID);
   })

   socket.on("get_player_list", (roomID: string) => {
       updatePlayerList(roomID);
   });

   socket.on("start_writing", (roomID: string) => {
       timers[roomID] = {timerID: undefined, timerCount: TIMER_COUNT};
       io.to(roomID).emit("open_write_screen", roomID);
       startTimer(roomID);
   });

   function startTimer(roomID: string) {
      if (!timers[roomID]) {
          console.log("Room was not given timer"); // really should not happen
          return;
      }
      timers[roomID].timerID = setInterval(() => {
          timers[roomID].timerCount--;
          io.to(roomID).emit('update_timer', timers[roomID].timerCount);

          if (timers[roomID].timerCount <= 0) {
              io.to(roomID).emit('request_ideas', roomID);
              room_dict[roomID].expected_idea_responses = room_dict[roomID].player_IDs.length;
              clearInterval(timers[roomID].timerID);
          }
      }, 1000);
   }

   socket.on("submit_ideas", (roomID, ideas_list: string[]) => {
       if (!room_dict[roomID].ideas_list) {
           ideas_list = [];
       }
       console.log(`ideas: ${ideas_list}`);
       console.log(`room_dict[roomID].ideas_list: ${room_dict[roomID].ideas_list}`);
       room_dict[roomID].ideas_list.push(...ideas_list);
       room_dict[roomID].expected_idea_responses--;
       if (room_dict[roomID].expected_idea_responses === 0) {
           io.to(roomID).emit('open_rank_screen', roomID, room_dict[roomID].ideas_list);
           console.log(`Number of ideas: ${room_dict[roomID].ideas_list.length}`);
           console.log(room_dict[roomID].ideas_list);
           delete timers[roomID];
       }
   });

   // when this is called, socket is already undefined
    socket.on("disconnect", () => {
        const sessionID = socket.sessionID;
        const oldSocketID = socket.id;

        setTimeout(() => {
            const currentSocketID = session_ids_to_player_ids[sessionID];
            const isReconnected = currentSocketID && currentSocketID !== oldSocketID;

            if (!isReconnected) {
                console.log("not a reconnect");
                const player_room = player_dict[oldSocketID]?.roomID;
                delete player_dict[oldSocketID];
                if (player_room) {
                    removePlayerFromRoom(player_room);
                    updatePlayerList(player_room);
                }
            }
        }, 2000);
    });
});


// running backend on port 3000 TODO is this necessary?
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

