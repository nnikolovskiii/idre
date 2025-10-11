import React from "react";

interface DriveHeaderProps {
    notebookId: string;
}

const DriveHeader: React.FC<DriveHeaderProps> = ({ notebookId }) => {
    return (
        <header className="flex justify-between items-center pt-2 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-1">
                <h1 className="font-sans text-[22px] font-normal m-0 text-gray-800">My Drive</h1>
            </div>
            <div className="flex items-center gap-1">
                {/* Commented out view toggles */}
            </div>
        </header>
    );
};

export default DriveHeader;