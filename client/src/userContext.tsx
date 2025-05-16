import {createContext, ReactNode, useContext, useState} from 'react';

// context is react's way of storing state globally
// I want the following states & setters to be accessible globally (across all pages)
interface UserContextType {
    username: string;
    setUsername: (value: string) => void;
    roomID: string;
    setRoomID: (value: string) => void;
}

const UserContext = createContext<UserContextType | null>(null);

// if <UserProvider> wraps something, the children prop is automatically passed into here
export const UserProvider = ({ children }: { children : ReactNode }) => {
    const [username, setUsername] = useState('');
    const [roomID, setRoomID] = useState('');

    return (
        <UserContext.Provider value={{ username, setUsername, roomID, setRoomID }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};