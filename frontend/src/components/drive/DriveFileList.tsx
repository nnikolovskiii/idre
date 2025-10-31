import React from "react";
import type { FileData } from "../../services/filesService";
import DriveFileItem from "./DriveFileItem";

interface DriveFileListProps {
    items: FileData[];
    onFileClick: (item: FileData) => void;
    onViewTranscription?: (item: FileData) => void;
    onDelete?: (item: FileData) => void;
    onEdit?: (item: FileData, newFilename: string) => void;
}

const DriveFileList: React.FC<DriveFileListProps> = ({ items, onFileClick, onViewTranscription, onDelete, onEdit }) => {
    return (
        <div className="w-full">
            {/* Desktop Header: Hidden on mobile */}
            <div className="hidden md:grid grid-cols-[minmax(250px,_2fr)_1fr_1fr_1.2fr_60px] border-b border-gray-200 items-center text-sm font-medium">
                <div className="p-3 flex items-center whitespace-nowrap font-bold">
                    Name
                </div>
                <div className="p-3 whitespace-nowrap">Date modified</div>
                <div className="p-3 whitespace-nowrap">File size</div>
                <div className="p-3 whitespace-nowrap">Transcription</div>
                <div className="p-3"></div> {/* Empty cell for actions column */}
            </div>

            {/* File List */}
            <div className="mt-4 space-y-3 md:mt-0 md:space-y-0">
                {items.map((item) => (
                    <DriveFileItem
                        key={item.file_id}
                        item={item}
                        onFileClick={onFileClick}
                        onViewTranscription={onViewTranscription}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </div>
    );
};

export default DriveFileList;
