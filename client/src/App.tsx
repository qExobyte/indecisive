import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './userContext';
import Start from './pages/start';
import Lobby from './pages/lobby';
import RoomCode from "./pages/room-code";
import SessionManager from "./sessionManager";
import Write from "./pages/write";
import Rank from "./pages/ranking";
import Results from "./pages/results";

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
                    <Route path={"/results/:room_id"} element={<Results />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
