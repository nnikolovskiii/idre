import React from "react";

const DriveLoading: React.FC = () => (
    <div className="flex items-center justify-center p-10 text-gray-600 text-sm">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3"></div>
        <span>Loading files...</span>
    </div>
);

export default DriveLoading;