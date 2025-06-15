import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import {useUser} from "../userContext";

const Start: React.FC = () => {
    const {setID, username, setUsername,  setRoomID} = useUser();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    // useEffect runs when THIS SPECIFIC COMPONENT (in this case this page) loads
    useEffect(() => {
        socket.connect();
        setID(socket.id);

        socket.on('room_created', (roomId: string) => {
            setRoomID(roomId);
            sessionStorage.setItem("roomID", roomId);
            navigate(`/lobby/${roomId}`);
        });

        socket.on('fail_to_create_room', () => {
            setError("Must have valid username");
        })

        // stop listening to room_created - safeguard against switching routes back and forth
        return () => {
            socket.off('room_created');
        };
    }, []);
    // second parameter is a list of dependencies
    // useEffect runs when the page loads AND when the dependencies change
    // ex. if [socket] then every time socket changes we run useEffect again

    const createRoom = () => {
        socket.emit('create_room', username);
    };

    const roomCodeScreen = () => {
        navigate(`/room-code`);
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
            <div className="mt-24 space-y-8">
                <h1 className="text-2xl font-bold text-center ">Indecisive?</h1>
                <div className="flex flex-col items-center">
                    <input
                        placeholder="Username"
                        className="w-full max-w-md px-6 py-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg transition-all duration-300 ease-in-out"
                        onChange={(event) => setUsername(event.target.value)}
                    />
                    <h4 className="mt-4">{error}</h4>
                </div>
                <div className="flex justify-center space-x-4">
                    <button onClick={createRoom} className="focus:ring-opacity-75 rounded-md bg-blue-600 px-6 py-4 font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        Create Room
                    </button>
                    <button onClick={roomCodeScreen} className="rounded-md bg-green-600 px-6 py-4 font-semibold text-white shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none">
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Start;