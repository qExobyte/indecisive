import {createContext, ReactNode, useContext, useState} from 'react';

// context is react's way of storing state globally
// I want the following states & setters to be accessible globally (across all pages)
interface UserContextType {
    id: string | undefined;
    setID: (value: string | undefined) => void;
    username: string;
    setUsername: (value: string) => void;
    roomID: string;
    setRoomID: (value: string) => void;
    ideas: string[];
    setIdeas: (value: string[] | ((prevState: string[]) => string[])) => void;
}

const UserContext = createContext<UserContextType | null>(null);

// if <UserProvider> wraps something, the children prop is automatically passed into here
export const UserProvider = ({ children }: { children : ReactNode }) => {
    const [username, setUsername] = useState('');
    const [roomID, setRoomID] = useState('');
    const [id, setID] = useState<string | undefined>(undefined);
    const [ideas, setIdeas] = useState<string[]>([]);

    return (
        <UserContext.Provider value={{ id, setID, username, setUsername, roomID, setRoomID, ideas, setIdeas }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};