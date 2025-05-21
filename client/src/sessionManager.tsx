import { useEffect } from "react";
import { useUser } from "./userContext";
import { socket } from "./socket";

const SessionManager = () => {
    const { setRoomID } = useUser();

    useEffect(() => {
        const sessionID = sessionStorage.getItem("sessionID");
        const storedRoomID = sessionStorage.getItem("roomID");

        if (storedRoomID) setRoomID(storedRoomID);

        socket.auth = { sessionID };
        socket.connect();

        socket.on("session", (sessionID) => {
            sessionStorage.setItem("sessionID", sessionID);
            console.log(`Retrieved sessionID from storage: ${sessionID}`);
        });

        return () => {
            socket.off("session");
            socket.disconnect();
        };
    }, []);

    return null;
};

export default SessionManager;
