import React, {useEffect, useState} from 'react';
import './App.css';
import io from 'socket.io-client'

const socket = io('http://localhost:3001');

const App: React.FC = () => {

    const [room, setRoom] = useState("");

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

    // react hook that gets called when an event is thrown to us
    useEffect(() => {
        socket.on("receive_msg", (data) => {
            setMessageReceived(data.message);
        })
    }, [socket]);

    return (
        <div className="App">
            {/* 'event' type passed automatically when the onChange event is called */}
            {/* 'event.target' is react's way of getting the element which called the event (input) */}
            <input placeholder="msg" onChange={(event) => {
                setMessage(event.target.value);
            }}/>
            <button onClick={sendMessage}>Send Message</button>
            <input placeholder={"Enter room number"} onChange={(event) => {
                setRoom(event.target.value);
            }}/>
            <button onClick={joinRoom}>Join Room</button>
            <h1> Message: </h1>
            { messageReceived }
        </div>
    );
};

export default App;

// server (backend) > npm run dev
// client (frontend) > npm start
