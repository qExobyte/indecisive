import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './userContext';
import Start from './pages/start';
import Lobby from './pages/lobby';
import RoomCode from "./pages/room-code";
import SessionManager from "./sessionManager";
import Write from "./pages/write";
import Rank from "./pages/ranking";

const App: React.FC = () => {

    return (
        <UserProvider>
            <SessionManager />
            <Router>
                <Routes>
                    <Route path="/" element={<Start />} />
                    <Route path="/lobby/:room_id" element={<Lobby />} />
                    <Route path="/room-code" element={<RoomCode />} />
                    <Route path="/write/:room_id" element={<Write />} />
                    <Route path={"/rank/:room_id"} element={<Rank />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
