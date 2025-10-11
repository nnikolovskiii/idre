import React, { useState, useEffect, useRef } from "react";
import {
    MdInsertDriveFile,
    MdImage,
    MdAudiotrack,
    MdPictureAsPdf,
    MdCode,
    MdDescription,
    MdVideocam,
} from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import type { FileData } from "../../lib/filesService";

interface DriveFileItemProps {
    item: FileData;
    onFileClick: (item: FileData) => void;
    onViewTranscription?: (item: FileData) => void;
    onDelete?: (item: FileData) => void;
}

const DriveFileItem: React.FC<DriveFileItemProps> = ({ item, onFileClick, onViewTranscription, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleClick = () => onFileClick(item);

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(item);
        setShowMenu(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    };

    const getFileIcon = () => {
        const contentType = item.content_type;
        const extension = item.filename.split(".").pop()?.toLowerCase() || '';

        if (contentType?.startsWith("image/")) return { icon: MdImage, color: "#1a73e8" };
        if (contentType?.startsWith("audio/")) return { icon: MdAudiotrack, color: "#34a853" };
        if (contentType?.startsWith("video/")) return { icon: MdVideocam, color: "#ea4335" };
        if (contentType === "application/pdf") return { icon: MdPictureAsPdf, color: "#db4437" };
        if (contentType?.startsWith("text/") || ["js", "ts", "py", "html", "css", "json", "txt"].includes(extension)) {
            return { icon: MdCode, color: "#4285f4" };
        }
        if (["doc", "docx", "xls", "xlsx"].includes(extension)) {
            return { icon: MdDescription, color: "#fbbc04" };
        }
        return { icon: MdInsertDriveFile, color: "#1967d2" };
    };

    const renderTranscriptionContent = () => {
        const status = item.processing_status;
        const isAudio = item.content_type?.startsWith("audio/");

        if (!isAudio) return "—";

        switch (status) {
            case "pending":
                return "No transcription";
            case "processing":
                return (
                    <div className="flex justify-start items-center w-full">
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                );
            case "completed":
                return item.processing_result?.transcription ? (
                    <button
                        className="bg-blue-600 text-white border-none rounded px-2 py-1 text-xs cursor-pointer transition-colors hover:bg-blue-700 whitespace-nowrap"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewTranscription?.(item);
                        }}
                    >
                        View Transcription
                    </button>
                ) : "No transcription";
            case "failed":
                return "Failed";
            default:
                return "—";
        }
    };

    const { icon: Icon, color: iconColor } = getFileIcon();

    return (
        <div className="grid grid-cols-[minmax(150px,_2fr)_0.8fr_0.8fr_1fr_50px] md:grid-cols-[minmax(200px,_2fr)_1fr_0.8fr_1fr_60px] lg:grid-cols-[minmax(300px,_2fr)_1.2fr_1fr_1.5fr_80px] border-b border-gray-200 items-center min-w-[450px] md:min-w-[550px] lg:min-w-[700px] text-xs md:text-sm text-gray-700 cursor-pointer hover:bg-gray-50 hover:rounded-md transition-colors group relative" onClick={handleClick}>
            <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis font-medium">
                <Icon size={24} style={{ marginRight: 16, color: iconColor, flexShrink: 0 }} />
                <span className="truncate">{item.filename}</span>
            </div>
            <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{formatDate(item.updated_at || item.created_at)}</div>
            <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{item.file_size || "—"}</div>
            <div className="p-2 md:p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis justify-start">{renderTranscriptionContent()}</div>
            <div className="p-2 md:p-3 flex items-center justify-end pr-5 md:pr-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
                <BsThreeDotsVertical size={18} onClick={handleMenuToggle} className="cursor-pointer" />
                {showMenu && (
                    <div className="absolute top-full right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[120px]">
                        <div className="px-4 py-2 cursor-pointer text-sm text-gray-700 hover:bg-gray-50" onClick={handleDelete}>
                            Delete
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriveFileItem;