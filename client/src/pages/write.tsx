import React, {useState, KeyboardEvent, DragEvent, useEffect} from 'react';
import TrashIcon from '../assets/trash.svg';
import {socket} from "../socket";
import {useNavigate} from "react-router-dom";

const Write = () => {
    // current idea input
    const [ideaInput, setIdeaInput] = useState<string>('');
    // list of ideas
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isDraggingOverTrash, setIsDraggingOverTrash] = useState<boolean>(false);
    const [timerCount, setTimerCount] = useState<number>(30);
    const navigate = useNavigate();

    // Function to handle the input field's key down events
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // Check if the Enter key was pressed and the input field is not empty
        if (event.key === 'Enter' && ideaInput.trim() !== '') {
            // ...ideas = "idea1", "idea2", etc
            // so now we set the ideas list to a list with [all those elements, "idea n"]
            setIdeas([...ideas, ideaInput.trim()]);
            setIdeaInput('');
        }
    };

    // Function to handle drag start on an idea item
    const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
        // Set the data to be transferred (the index of the item)
        e.dataTransfer.setData('text/plain', index.toString());
        // Add a class for visual feedback during drag
        e.currentTarget.classList.add('opacity-50', 'border-dashed', 'border-2', 'border-indigo-500');
    };

    // Function to handle drag end on an idea item
    const handleDragEnd = (e: DragEvent<HTMLLIElement>) => {
        // Remove visual feedback after drag ends
        e.currentTarget.classList.remove('opacity-50', 'border-dashed', 'border-2', 'border-indigo-500');
    };

    // Function to handle drag over on the trash can
    const handleDragOverTrash = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
        setIsDraggingOverTrash(true); // Indicate that an item is being dragged over the trash can
    };

    // Function to handle drag leave on the trash can
    const handleDragLeaveTrash = () => {
        setIsDraggingOverTrash(false); // Indicate that the item left the trash can area
    };

    // Function to handle drop on the trash can
    const handleDropOnTrash = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOverTrash(false); // Reset drag over state

        // Get the index of the dragged item
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

        // Filter out the dragged item from the ideas list
        setIdeas(currentIdeas => currentIdeas.filter((_, i) => i !== draggedIndex));
    };

    useEffect(() => {
        socket.on("update_timer", (timerCount: number) => {
            setTimerCount(timerCount);
        });

        socket.on("open_rank_screen", (roomID) => {
            navigate(`/rank/${roomID}`);
        });
    }, [])

    return (
        // Main container for the entire application, centered vertically and horizontally
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-inter">
            {/* Centered H1 heading */}
            <h1 className="text-4xl mb-8 text-center">
                Enter your ideas
            </h1>

            {/* Timer display (indigo circle with number 30) */}
            <div className="relative mb-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-5xl font-extrabold">{timerCount}</span>
                </div>
                {/* Less aggressive pulse animation using animate-pulse */}
                <span className="animate-pulse absolute inset-0 inline-flex h-full w-full rounded-full bg-indigo-400 opacity-50"></span>
            </div>

            {/* Input field for ideas */}
            <input
                type="text"
                placeholder="Type your idea and hit Enter..."
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full max-w-md px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg transition-all duration-300 ease-in-out"
            />

            {/* Ideas list and trash can container */}
            <div className="w-full max-w-md flex flex-col sm:flex-row mt-6 gap-4 items-start">
                {/* Ideas list container (no background panel) */}
                <div
                    className={`flex-grow transition-all ${
                        ideas.length > 0 ? 'py-0 px-0 opacity-100' : 'p-0 opacity-0 h-0 overflow-hidden'
                    }`}
                >
                    {/* Only show the list if there are ideas */}
                    {ideas.length > 0 && (
                        <ul className="space-y-3">
                            {ideas.map((idea, index) => (
                                <li
                                    key={index} // Using index as key is acceptable for static lists, for dynamic lists with deletions/reorders, unique IDs are better
                                    draggable="true" // Make the item draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between w-full cursor-grab active:cursor-grabbing border border-gray-200"
                                >
                                  <span className="text-gray-700 text-lg flex items-start">
                                    <span className="text-indigo-500 mr-2">•</span>
                                    {idea}
                                  </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Trash Can Icon */}
                <div
                    onDragOver={handleDragOverTrash}
                    onDragLeave={handleDragLeaveTrash}
                    onDrop={handleDropOnTrash}
                    className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-xl transition-colors duration-200 ${
                        isDraggingOverTrash ? 'bg-red-200 border-2 border-red-500' : 'bg-gray-200'
                    } shadow-md`}
                >
                    <img
                        src={TrashIcon}
                        alt="Trash Can Icon Placeholder"
                        className="w-12 h-12"
                    />
                </div>
            </div>
        </div>
    );
}

export default Write;
