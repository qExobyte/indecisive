import { useLocation, useNavigate } from "react-router-dom";
import React from "react";

const GoldMedal = () => (
    <svg className="w-5 h-5 text-yellow-500 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
);

const SilverMedal = () => (
    <svg className="w-5 h-5 text-gray-400 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
);

const BronzeMedal = () => (
    <svg className="w-5 h-5 text-amber-700 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
    </svg>
);

const Results = () => {
    const location = useLocation();
    const points_dict: { [key: string]: number } = location.state?.points_dict || {};
    const dictIsEmpty = Object.keys(points_dict).length === 0;

    // convert dictionary to an array of [key, value] pairs and sort them
    const sortedPoints = Object.entries(points_dict).sort(([, valueA], [, valueB]) => valueB - valueA);

    const navigate = useNavigate();

    const backToLobby = () => {
        navigate(`/`);
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg mb-8">
                <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-12">Rankings</h2>
                <div className="dictionary-container">
                    {dictIsEmpty ? (
                        <p className="text-center text-gray-500 text-lg">No items to display.</p>
                    ) : (
                        <ul className="list-none p-0">
                            {/* Iterate over sorted key-value pairs */}
                            {sortedPoints.map(([key, value], index) => (
                                <li
                                    key={key}
                                    className={`
                                        flex items-center justify-between
                                        py-3 px-4 mb-2 rounded-lg
                                        ${index === 0 ? 'bg-yellow-100 border-l-4 border-yellow-500' : ''}
                                        ${index === 1 ? 'bg-gray-100 border-l-4 border-gray-400' : ''}
                                        ${index === 2 ? 'bg-amber-50 border-l-4 border-amber-700' : ''}
                                        ${index > 2 ? 'bg-white border-b border-gray-200' : ''}
                                        shadow-sm
                                    `}
                                >
                                    <div className="flex items-center">
                                        {index === 0 && <GoldMedal />}
                                        {index === 1 && <SilverMedal />}
                                        {index === 2 && <BronzeMedal />}
                                        <span className="text-lg font-medium text-gray-800">
                                            {index + 1}. {key}
                                        </span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-900">{value}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <button onClick={backToLobby} className="focus:ring-opacity-75 rounded-md bg-blue-600 px-6 py-4 font-semibold text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                Decide More
            </button>
        </div>
    );
};

export default Results;