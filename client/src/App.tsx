import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './userContext';
import Start from './pages/start';
import Lobby from './pages/lobby';

const App: React.FC = () => {
    return (
        <UserProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Start />} />
                    <Route path="/lobby/:room_id" element={<Lobby />} />
                </Routes>
            </Router>
        </UserProvider>
    );
};

export default App;
