import {useUser} from '../userContext';
import { useNavigate } from 'react-router-dom';
import {useState, useEffect} from "react";
import {socket} from "../socket";

const Lobby = () => {
    const {roomID, username} = useUser();
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Set<string>>(new Set());

    useEffect(() => {
        socket.emit("get_player_list", roomID);

        socket.on("update_player_list", (playerList: string[]) => {
            setPlayers(new Set(playerList));
        });

        return () => {
            socket.off('update_player_list');
        };
    }, [roomID]);

    const startGame = () => {
        socket.emit('start_writing', roomID);
        alert("game starting"); // TODO implement
    }

    const leaveLobby = () => {
        socket.emit('leave_room', roomID, username);
        alert("left room lol"); // TODO implement
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-50 px-6 py-12">
            <h2 className="text-2xl font-bold text-indigo-600 mb-6">Room Code: {roomID}</h2>

            <div className="w-full max-w-md bg-white rounded-2xl shadow p-4 mb-6">
                <ul className="space-y-2">
                    {[...players].map((name, i) => (
                        <li key={i} className="px-4 py-2 rounded text-center font-medium">
                            {name}
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={startGame} className="w-full max-w-sm bg-green-600 text-white font-semibold py-2 rounded-xl mb-4 hover:bg-green-700 hover:scale-103">
                Start
            </button>

            <button onClick={leaveLobby} className="w-full max-w-sm bg-red-500 text-white font-semibold py-2 rounded-xl hover:bg-red-600 transition hover:scale-30 transition ease duration-7000">
                Leave Room
            </button>
        </div>
    );
};

export default Lobby;
