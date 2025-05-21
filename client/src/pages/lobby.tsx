import {useUser} from '../userContext';
import { useNavigate } from 'react-router-dom';
import {useState, useEffect} from "react";
import {socket} from "../socket";

const Lobby = () => {
    const {roomID} = useUser();
    const navigate = useNavigate();
    const [usernames, setUsernames] = useState<string[]>([]);

    useEffect(() => {
        socket.emit('get_player_list', roomID);

        // handling with a separate function allows for proper cleanup
        // trust
        socket.on("update_player_list", (username_list: string[]) => {
            setUsernames(username_list);
        });
    }, [socket, roomID]);

    useEffect(() => {
        socket.on("disconnect", () => {
            console.log("printy print");
            navigate("/");
        });

        return () => {
            socket.off("disconnect");
        };
    }, [socket]);

    const startGame = () => {
        socket.emit('start_writing', roomID);
        alert("game starting"); // TODO implement
    }

    const leaveLobby = () => {
        socket.emit('leave_room', roomID, socket.id);
        navigate(`/`);
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 px-6 py-12">
            <h2 className="text-2xl font-bold text-indigo-600 mb-6">Room Code: {roomID}</h2>

            <div className="w-full max-w-md bg-white rounded-2xl shadow p-4 mb-6">
                <ul className="space-y-2">
                    {usernames.map((name, i) => (
                        <li key={i} className="px-4 py-2 rounded text-center font-medium">
                            {name}
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={startGame} className="w-full max-w-sm bg-green-600 text-white font-semibold py-2 rounded-xl mb-4 hover:bg-green-700 hover:scale-103">
                Start
            </button>

            <button onClick={leaveLobby} className="w-full max-w-sm bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-700 hover:scale-103">
                Leave Room
            </button>
        </div>
    );
};

export default Lobby;
