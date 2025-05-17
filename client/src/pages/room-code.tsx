import React, { useEffect } from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";
import { useUser } from "../userContext";

const RoomCode = () => {
    const navigate = useNavigate();
    const {username, roomID, setRoomID} = useUser();

    useEffect( () => {
        socket.on("send_to_room", (room, username)=> {
            navigate(`/lobby/${room}`);
        });

        return () => {
            socket.off("send_to_room");
        }
    }, [socket]);

    const joinRoom = () => {
        socket.emit('attempt_join_room', roomID, username);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
            <div className="mt-24 space-y-8">
                <div>
                    <input
                        placeholder="Room Code"
                        className="w-full px-4 py-2 border font-bricolage border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        onChange={(event) => setRoomID(event.target.value)}
                    />
                </div>
                <button onClick={joinRoom} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                    Join Room
                </button>
            </div>
        </div>
    );
};

export default RoomCode;
