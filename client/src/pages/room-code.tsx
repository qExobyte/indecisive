import React, {useEffect, useState} from "react";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";
import { useUser } from "../userContext";

const RoomCode = () => {
    const navigate = useNavigate();
    const {username, roomID, setRoomID} = useUser();
    const [error, setError] = useState("");

    useEffect( () => {
        socket.on("send_to_room", (room)=> {
            navigate(`/lobby/${room}`);
        });

        return () => {
            socket.off("send_to_room");
        }
    }, [socket]);

    useEffect( () => {
        socket.on("fail_to_join_room", msg => {
            setError(msg);
        })
    }, [socket]);

    const joinRoom = () => {
        socket.emit('attempt_join_room', roomID, username);
    };

    const backToStart = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
            <div className="mt-24 space-y-8">
                <div className="flex flex-col items-center">
                    <input
                        placeholder="Room Code"
                        className="w-full px-4 py-2 border font-bricolage border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        onChange={(event) => {
                            setRoomID(event.target.value);
                            sessionStorage.setItem("roomID", event.target.value);
                        }}
                    />
                    <h4 className="mt-4">{error}</h4>
                </div>

                <div className="flex justify-center space-x-4">
                    <button onClick={backToStart} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        Back
                    </button>
                    <button onClick={joinRoom} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomCode;
