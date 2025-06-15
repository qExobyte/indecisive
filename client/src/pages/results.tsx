import {useLocation} from "react-router-dom";

const Results = () => {
    const location = useLocation();
    const points_dict : {[key:string] : number} = location.state?.points_dict || {};
    const dictIsEmpty = Object.keys(points_dict).length === 0;

    return (
        <div>
            <h1>yooo</h1>
            <div className="dictionary-container">
                {dictIsEmpty ? (
                    <p>No items to display.</p>
                ) : (
                    <ul className="list-disc list-inside">
                        {/* Iterate over key-value pairs using Object.entries() */}
                        {Object.entries(points_dict).map(([key, value]) => (
                            // Remember to use a unique key for each list item
                            <li key={key} className="my-1">
                                <strong>{key}:</strong> {value}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Results;