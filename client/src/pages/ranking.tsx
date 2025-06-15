import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {useLocation} from "react-router-dom";

const Rank = () => {
    const location = useLocation();
    const ideas_list = location.state?.ideas_list || [];

    const [ideas, setIdeas] = useState<string[]>([]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-inter">
            <h1 className="text-4xl mb-8 text-center">
                Rank the Ideas
            </h1>

            <div className="w-full max-w-md">
                {ideas_list.length > 0 ? (
                    <ul className="space-y-3">
                        {ideas_list.map((idea: string, index: number) => (
                            <li
                                key={index}
                                className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between w-full border border-gray-200 hover:border-indigo-500 transition-colors duration-200"
                            >
                                <span className="text-gray-700 text-lg flex items-center">
                                    <span className="text-indigo-500 mr-3 font-bold">
                                        {index + 1}.
                                    </span>
                                    {idea}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500">
                        No ideas to display
                    </div>
                )}
            </div>
        </div>

    );
};

export default Rank;