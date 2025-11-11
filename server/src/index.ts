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

enum RankingAlgorithm {
    CONDORCET = 'CONDORCET',
    BORDA_COUNT = 'BORDA_COUNT'
    // TODO probabilistic (...based on borda count points?)
}

interface RoomData {
    player_IDs: string[];  // set of player IDs (then use lookup table)
    can_join: boolean;
    ideas_list: string[];
    expected_idea_responses: number;
    expected_rank_responses: number;
    rankings: string[][];
    algorithm: RankingAlgorithm;
    rank_dict: {[key: string] : number}; // ideas -> rank
    points_dict: {[key: string] : number};  // ideas -> points (which may not be the same as rank!)
}

// for condorcet
interface PairwiseResult {
    winner: string;
    loser: string;
    margin: number;
}

// roomID --> roomData
const room_dict: {[key: string] : RoomData} = {};
let roomCounter = 1000;

// key: roomID -> val: {timerID, timerCount}
const timers: {[key: string] : {timerID: NodeJS.Timeout | number | undefined | string, timerCount: number}} = {};
const TIMER_COUNT = 30;

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
        console.log(`Creating new player info for ${socket.id}`);
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
           const roomID = String(roomCounter);
           socket.join(roomID);
           console.log(`Socket ID ${socket.id} is trying to create room ${roomID}`);
           console.log(`Player dict: ${JSON.stringify(player_dict, null, 2)}`);
           player_dict[socket.id].username = username;
           player_dict[socket.id].roomID = roomID;

           room_dict[roomID] = {
               player_IDs: [socket.id],
               can_join: true,
               ideas_list: [],
               expected_idea_responses: 0,
               expected_rank_responses: 0,
               rank_dict: {},
               points_dict: {},
               rankings: [],
               algorithm: RankingAlgorithm.CONDORCET
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
       room_dict[roomID].can_join = false;
       io.to(roomID).emit("open_write_screen", roomID);
       startTimer(roomID);
   });

   function startTimer(roomID: string) {
      if (!timers[roomID]) {
          console.log("Room was not given timer"); // really should not happen
          return;
      }
      io.to(roomID).emit('update_timer', timers[roomID].timerCount);
      timers[roomID].timerID = setInterval(() => {
          timers[roomID].timerCount--;
          io.to(roomID).emit('update_timer', timers[roomID].timerCount);

          if (timers[roomID].timerCount <= 0) {
              io.to(roomID).emit('request_ideas', roomID);
              room_dict[roomID].expected_idea_responses = room_dict[roomID].player_IDs.length;
              room_dict[roomID].expected_rank_responses = room_dict[roomID].player_IDs.length;
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
           delete timers[roomID];
       }
   });

    // a singular player has sent their rankings
    // we must incorporate that into aggregate rank and then only run the algo when all rankings are submitted
    socket.on("submit_rank", (roomID, rank_list: string[]) => {
        room_dict[roomID].expected_rank_responses--;
        room_dict[roomID].rankings.push(rank_list);
        if (room_dict[roomID].expected_rank_responses === 0) {
            rankAlgorithm(roomID);
        }
    });

    function rankAlgorithm(roomID: any) {
        const rankings: string[][] = room_dict[roomID].rankings;
        // these algorithms all modify points_dict in-place
        const algorithm = room_dict[roomID].algorithm;
        switch(algorithm) {
            case 'CONDORCET':
                condorcet(roomID, rankings);
                break;
            case 'BORDA_COUNT':
                bordaCountAlgorithm(roomID, rankings);
                break;
            default:
                condorcet(roomID, rankings);
        }
        io.to(roomID).emit('open_results_screen', roomID, room_dict[roomID].points_dict, room_dict[roomID].rank_dict);
    }

    function condorcet(roomID: any, rankings: string[][]) {
        const ideas_list = room_dict[roomID].ideas_list;
        const pairwiseResults = calculatePairwiseResults(ideas_list, rankings);
        const sortedVictories = sortVictories(pairwiseResults);
        const lockedPairs = lockInCycleFreePairs(sortedVictories);
        const rankedDict = getFinalRanking(ideas_list, lockedPairs);
        room_dict[roomID].rank_dict = rankedDict;
        // include points from borda count, while ranking with condorcet
        bordaPoints(roomID, rankings);
    }

    function calculatePairwiseResults (ideas_list: string[], rankings: string[][]) : PairwiseResult[] {
        const results : PairwiseResult[] = [];
        // looping through every PAIR of ideas
        for (let i = 0; i < ideas_list.length; i++) {
            for (let j = 0; j < ideas_list.length; j++) {
                const itemA : string = ideas_list[i];
                let aVotes : number = 0;
                const itemB : string = ideas_list[j];
                let bVotes : number = 0;
                // now loop through every set of rankings
                for (let v = 0; v < rankings.length; v++) {
                    const indexA = rankings[v].indexOf(itemA);
                    const indexB = rankings[v].indexOf(itemB);
                    if (indexA < indexB) {
                        aVotes++;
                    } else {
                        bVotes++;
                    }
                }
                // record win, loss, and margin
                // need all 3 for tiebreaking
                if (aVotes !== bVotes) {
                    const winner = aVotes > bVotes ? itemA : itemB;
                    const loser = aVotes > bVotes ? itemB : itemA;
                    const margin = Math.abs(aVotes - bVotes);
                    results.push({ winner, loser, margin });
                }
            }
        }
        return results;
    }

    function sortVictories(results: PairwiseResult[]): PairwiseResult[] {
        return results.sort((a, b) => b.margin - a.margin);
    }

    // a bit verbose, but that's what we're doing
    function lockInCycleFreePairs(sortedVictories: PairwiseResult[]): PairwiseResult[] {
        const lockedPairs: PairwiseResult[] = [];
        for (const victory of sortedVictories) {
            if (!detectCycles(victory.loser, victory.winner, lockedPairs)) {
                lockedPairs.push(victory); // lock it innnnn
            }
        }
        return lockedPairs;
    }

    // detects if an item lost a matchup but still has a chance of beating the other item transitively
    // ex.) A > B , B > C , C > A -- who wins??
    // returns true if one of these cycles DOES occur
    function detectCycles(start: string, end: string, lockedPairs: PairwiseResult[]): boolean {
        // base case
        if (start === end) {
            return true;
        }

        // get all items that 'start' defeats in the locked pairs
        const winners = lockedPairs
            .filter(pair => pair.winner === start)
            .map(pair => pair.loser);

        // recursively check paths of defeated candidates (dfs)
        for (const next of winners) {
            if (detectCycles(next, end, lockedPairs)) {
                return true;
            }
        }
        return false;
    }

    // just trust bro
    function getFinalRanking(items: string[], lockedPairs: PairwiseResult[]) {
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, string[]>(); // Adjacency List (Winner -> [Loser1, Loser2, ...])
        const finalRanking : {[key: string] : number} = {};

        // 1. Initialize In-Degrees and Adjacency List
        for (const candidate of items) {
            inDegree.set(candidate, 0);
            adjList.set(candidate, []);
        }

        for (const pair of lockedPairs) {
            // Build the graph: Winner -> Loser
            adjList.get(pair.winner)?.push(pair.loser);
            // Count incoming edges (defeats)
            inDegree.set(pair.loser, inDegree.get(pair.loser)! + 1);
        }

        // 2. Initialize Queue with candidates who have In-Degree 0 (the potential winners)
        const queue: string[] = items.filter(c => inDegree.get(c) === 0);

        let currentRank = 1;
        let rankQueue: string[] = []; // To handle candidates tied for the same rank

        // 3. Process and Reduce
        while (queue.length > 0 || rankQueue.length > 0) {
            if (rankQueue.length === 0) {
                // Move all current winners (queue) into the rankQueue for consistent ranking
                rankQueue = queue.splice(0, queue.length);
            }

            const current = rankQueue.shift()!; // Get the next candidate to rank
            finalRanking[current] ??= currentRank;

            // 4. Reduce In-Degrees of defeated candidates
            const defeatedCandidates = adjList.get(current) || [];
            for (const next of defeatedCandidates) {
                inDegree.set(next, inDegree.get(next)! - 1);

                // If in-degree drops to 0, they are next in line to win
                if (inDegree.get(next) === 0) {
                    queue.push(next);
                }
            }

            // Only increment rank after all tied candidates at the current level are processed
            if (rankQueue.length === 0) {
                currentRank++;
            }
        }

        return finalRanking;
    }

    // deprecated algorithm because it's LAME and BORING
    function bordaCountAlgorithm(roomID: any, rankings: string[][]) {
        bordaPoints(roomID, rankings);
        const sortedPointsArray = Object.entries(room_dict[roomID].points_dict).sort((a, b) => b[1] - a[1]);
        sortedPointsArray.forEach(([idea, pts], index) => {
            room_dict[roomID].rank_dict[idea] = index + 1;
        })
    }

    function bordaPoints(roomID: any, rankings: string[][]) {
        for (let i = 0; i < rankings.length; i++) {
            for (let j = 0; j < rankings[0].length; j++) {
                const idea = rankings[i][j];
                const points = rankings[i].length - j;
                room_dict[roomID].points_dict[idea] ??= 0;
                room_dict[roomID].points_dict[idea] += points;
            }
        }
    }

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
        }, 500);
    });
});


// running backend on port 3000 TODO is this necessary?
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

