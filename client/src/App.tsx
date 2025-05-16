import React, {useEffect, useState} from 'react';
import { socket } from './socket';

const App: React.FC = () => {

    const [room, setRoom] = useState("");
    const [username, setUsername] = useState("");

    // react notation for states: [stateName, functionToUpdateState] = useState(initialState);
    const [message, setMessage] = useState("");
    const [messageReceived, setMessageReceived] = useState("");

    const joinRoom = () => {
        if (room != '') {
            socket.emit("join_room", room);
        }
    };

    const sendMessage = () => {
        // emit event send_msg with data as a dictionary(?)
        socket.emit("send_msg", {message, room});
    };

    const createRoom = () => {
        socket.emit("create_room", username);
    }

    // react hook that gets called when an event is thrown to us
    useEffect(() => {
        socket.on("receive_msg", (data) => {
            setMessageReceived(data.message);
        });
    }, [socket]);

    return (
        // background with vertically stacked elements
        <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
            <div className="mt-24 space-y-8">
                <h1 className="text-2xl font-bricolage font-bold text-center text-indigo-500">
                    Indecisive?
                </h1>
                <div>
                    <input
                        placeholder="Username"
                        className="w-full px-4 py-2 border font-bricolage border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        onChange={(event) => setUsername(event.target.value)}
                    />
                </div>
            <div className="flex justify-center space-x-4">
                <button
                    className="focus:ring-opacity-75 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onClick={createRoom}
                >Create Room
                    </button>

                    <button
                        className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        // onClick={joinRoom}
                    >
                        Join Room
                    </button>
                </div>
            </div>

                {/*<input*/}
                {/*    placeholder="Enter your message"*/}
                {/*    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"*/}
                {/*    onChange={(event) => setMessage(event.target.value)}*/}
                {/*/>*/}
                {/*<button*/}
                {/*    onClick={sendMessage}*/}
                {/*    className="w-full bg-indigo-500 text-white py-2 rounded-md hover:bg-indigo-600 transition"*/}
                {/*>*/}
                {/*    Send Message*/}
                {/*</button>*/}
                {/*<input*/}
                {/*    placeholder="Enter room number"*/}
                {/*    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"*/}
                {/*    onChange={(event) => setRoom(event.target.value)}*/}
                {/*/>*/}
                {/*<button*/}
                {/*    onClick={joinRoom}*/}
                {/*    className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"*/}
                {/*>*/}
                {/*    Join Room*/}
                {/*</button>*/}
        </div>
    );


};

export default App;

// server (backend) > npm run dev
// client (frontend) > npm run dev
