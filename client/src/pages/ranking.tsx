import React, {useEffect, useState} from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DraggableProvided
} from '@hello-pangea/dnd';
import {useLocation, useNavigate} from "react-router-dom";
import {socket} from "../socket";
import {useUser} from "../userContext";

const Rank = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {roomID} = useUser();
    const ideas_list = location.state?.ideas_list || [];

    const [ideas, setIdeas] = useState<string[]>(ideas_list);
    const [isWaiting, setIsWaiting] = useState<boolean>(false);

    const reorder = (list: string[], startIndex: number, endIndex: number): string[] => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result: DropResult) => { // DropResult for type safety (?)
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const updatedIdeas = reorder(
            ideas, // Use the state variable directly
            result.source.index,
            result.destination.index
        );

        setIdeas(updatedIdeas);
    };
    
    const handleConfirm = () => {
        setIsWaiting(true);
        sessionStorage.setItem("waitingOnRankScreen", "true");
        socket.emit("submit_rank", roomID, ideas);
    }

    useEffect(() => {
        if (sessionStorage.getItem("waitingOnRankScreen") === "true") {
            setIsWaiting(true);
        }

        socket.on("open_results_screen", (roomID, points_dict : {[key: string] : number}) => {
            navigate(`/results/${roomID}`, {
                state: { points_dict }
            });
            sessionStorage.removeItem("waitingOnRankScreen");
        });
    }, [socket, navigate])

    // @ts-ignore
    // @ts-ignore
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-inter">
            <h1 className="text-4xl mb-8 text-center">
                Rank the Ideas
            </h1>

            <div className="w-full max-w-md">
                {ideas.length > 0 ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {/* just ignore this underline */}
                        <Droppable droppableId="ideas">
                            {(provided, snapshot)  => (
                            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {ideas.map((idea: string, index: number) => (
                                    <Draggable key={idea} draggableId={idea} index={index} isDragDisabled={isWaiting}
                                    >
                                        {(provided: DraggableProvided) => (
                                            <li ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between w-full border border-gray-200 hover:border-indigo-500 transition-colors duration-200"
                                            >
                                                <span className="text-gray-700 text-lg flex items-center">
                                                    <span className="text-indigo-500 mr-3 font-bold">
                                                        {index + 1}.
                                                    </span>
                                                    {idea}
                                                </span>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                            )}
                        </Droppable>
                    </DragDropContext>
                ) : (
                    <div className="text-center text-gray-500">
                        No ideas to display
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-center">
                <button
                    onClick={handleConfirm}
                    disabled={isWaiting}
                    className={`px-8 py-4 font-semibold rounded-lg transition-all duration-200 ${
                        isWaiting 
                        ? 'bg-green-200 text-green-700 cursor-not-allowed opacity-70' 
                        : 'bg-green-700 text-white hover:bg-green-600'
                    }`}
                >
                    {isWaiting ? 'Waiting...' : 'Confirm'}
                </button>
            </div>
        </div>
    );
};

export default Rank;
