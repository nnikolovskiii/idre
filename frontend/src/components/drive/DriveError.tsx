import React from "react";

interface DriveErrorProps {
    error: string;
    onRetry: () => void;
}

const DriveError: React.FC<DriveErrorProps> = ({ error, onRetry }) => (
    <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="text-red-700 text-sm mb-4 p-3 bg-red-50 rounded border border-red-300">
            {error}
        </div>
        <button className="bg-blue-600 text-white border-none rounded px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-blue-700" onClick={onRetry}>
            Retry
        </button>
    </div>
);

export default DriveError;