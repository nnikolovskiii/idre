import React from "react";
import { MdArrowUpward } from "react-icons/md";
import type { FileData } from "../../lib/filesService";
import DriveFileItem from "./DriveFileItem";

interface DriveFileListProps {
    items: FileData[];
    onFileClick: (item: FileData) => void;
    onViewTranscription?: (item: FileData) => void;
    onDelete?: (item: FileData) => void;
}

const DriveFileList: React.FC<DriveFileListProps> = ({ items, onFileClick, onViewTranscription, onDelete }) => {
    return (
        <div className="w-full overflow-x-auto">
            <div className="grid grid-cols-[minmax(150px,_2fr)_0.8fr_0.8fr_1fr_50px] md:grid-cols-[minmax(200px,_2fr)_1fr_0.8fr_1fr_60px] lg:grid-cols-[minmax(300px,_2fr)_1.2fr_1fr_1.5fr_80px] border-b border-gray-200 items-center min-w-[450px] md:min-w-[550px] lg:min-w-[700px] text-gray-600 text-xs md:text-sm font-medium">
                <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis text-blue-600 font-bold">
                    Name <MdArrowUpward size={16} className="ml-1" />
                </div>
                <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">Date modified</div>
                <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">File size</div>
                <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">Transcription</div>
            </div>

            {items.map((item) => (
                <DriveFileItem
                    key={item.file_id}
                    item={item}
                    onFileClick={onFileClick}
                    onViewTranscription={onViewTranscription}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default DriveFileList;