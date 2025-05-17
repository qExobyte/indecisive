import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import {useUser} from "../userContext";

const Start: React.FC = () => {
    const {username, setUsername, roomID, setRoomID} = useUser();
    const navigate = useNavigate();

    // useEffect runs when THIS SPECIFIC COMPONENT loads
    useEffect(() => {
        socket.connect();

        socket.on('room_created', (roomId: string) => {
            setRoomID(roomId);
            navigate(`/lobby/${roomId}`);
        });

        // stop listening to room_created - safeguard against switching routes back and forth
        return () => {
            socket.off('room_created');
        };
    }, []);

    const createRoom = () => {
        socket.emit('create_room', username);
    };

    const roomCodeScreen = () => {
        navigate(`/room-code`);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
            <div className="mt-24 space-y-8">
                <h1 className="text-2xl font-bricolage font-bold text-center text-indigo-500">Indecisive?</h1>
                <div>
                    <input
                        placeholder="Username"
                        className="w-full px-4 py-2 border font-bricolage border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>
                <div className="flex justify-center space-x-4">
                    <button onClick={createRoom} className="focus:ring-opacity-75 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        Create Room
                    </button>
                    <button onClick={roomCodeScreen} className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Start;