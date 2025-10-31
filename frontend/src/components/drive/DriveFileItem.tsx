import React, { useState, useEffect, useRef } from "react";
import {
    MdInsertDriveFile, MdImage, MdAudiotrack, MdPictureAsPdf,
    MdCode, MdDescription, MdVideocam, MdEdit, MdCheck, MdClose,
} from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import type { FileData } from "../../services/filesService";

interface DriveFileItemProps {
    item: FileData;
    onFileClick: (item: FileData) => void;
    onViewTranscription?: (item: FileData) => void;
    onDelete?: (item: FileData) => void;
    onEdit?: (item: FileData, newFilename: string) => void;
    // CHANGED: Add isSelected prop to know if this item is the active one
    isSelected?: boolean;
}

const DriveFileItem: React.FC<DriveFileItemProps> = ({ item, onFileClick, onViewTranscription, onDelete, onEdit, isSelected = false }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFilename, setEditFilename] = useState(item.filename);
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => onFileClick(item);

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(prev => !prev);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(item);
        setShowMenu(false);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditFilename(item.filename);
        setShowMenu(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editFilename.trim() && editFilename !== item.filename) {
            onEdit?.(item, editFilename.trim());
        }
        setIsEditing(false);
    };

    const handleEditCancel = (e?: React.MouseEvent | React.FocusEvent) => {
        e?.stopPropagation();
        setIsEditing(false);
        setEditFilename(item.filename);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleEditCancel(e as any);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const formatDateTime = (dateString: string | null) => {
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
        if (!isAudio) return <span className="text-gray-400">—</span>;
        switch (status) {
            case "processing":
                return <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Processing...</span>
                </div>;
            case "completed":
                return item.processing_result?.transcription ? (
                    <button
                        className="bg-blue-600 text-white border-none rounded-md px-2.5 py-1 text-xs cursor-pointer transition-colors hover:bg-blue-700 whitespace-nowrap"
                        onClick={(e) => { e.stopPropagation(); onViewTranscription?.(item); }}>
                        View
                    </button>
                ) : <span className="text-sm text-gray-500">No transcription</span>;
            case "failed":
                return <span className="text-sm text-red-500">Failed</span>;
            default:
                return <span className="text-sm text-gray-500">No transcription</span>;
        }
    };

    const { icon: Icon, color: iconColor } = getFileIcon();

    const fileIdentifier = (
        <div className="flex items-center gap-4 min-w-0">
            <Icon size={24} style={{ color: iconColor, flexShrink: 0 }} />
            {isEditing ? (
                // ... (editing UI remains the same)
                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editFilename}
                        onChange={(e) => setEditFilename(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditSubmit(e as React.FormEvent);
                        }}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"

                    >
                        <MdCheck size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditCancel(e);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"

                    >
                        <MdClose size={16} />
                    </button>
                </div>
            ) : (
                // CHANGED: Apply conditional styling to the filename
                <span className={`truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>
                    {item.filename}
                </span>
            )}
        </div>
    );

    const actionMenu = (
        // ... (action menu remains the same)
        <div className="relative" ref={menuRef}>
            <button onClick={handleMenuToggle} className="p-2 rounded-full hover:bg-muted">
                <BsThreeDotsVertical size={18} />
            </button>
            {showMenu && (
                <div className="absolute top-full right-0 bg-muted  hover:bg-muted/20 rounded-lg shadow-lg z-10 min-w-[140px] border">
                    <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/80 flex items-center gap-2"
                        onClick={handleEdit}
                    >
                        <MdEdit size={16} />
                        Edit
                    </button>
                    <button className="block w-full text-left px-4 py-2 text-sm hover:bg-muted/80" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="group text-sm">
            {/* Mobile Card Layout */}
            {/* CHANGED: Apply conditional background color */}
            <div
                onClick={handleClick}
                className={`md:hidden flex flex-col gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
                <div className="flex justify-between items-start">
                    {fileIdentifier}
                    {actionMenu}
                </div>
                <div className="pl-10 flex flex-col gap-2">
                    <div className="text-xs  flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{item.file_size || "—"}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatDate(item.updated_at || item.created_at)}</span>
                    </div>
                    <div className="flex items-center">
                        {renderTranscriptionContent()}
                    </div>
                </div>
            </div>

            {/* Desktop Table Row Layout */}
            {/* CHANGED: Apply conditional background color */}
            <div
                onClick={handleClick}
                className={`hidden md:grid grid-cols-[minmax(250px,_2fr)_1fr_1fr_1.2fr_60px] border-b items-center cursor-pointer transition-colors ${isSelected ? 'bg-muted' : 'hover:bg-muted'}`}
            >
                <div className="p-3 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{fileIdentifier}</div>
                <div className="p-3 whitespace-nowrap overflow-hidden text-ellipsis ">{formatDateTime(item.updated_at || item.created_at)}</div>
                <div className="p-3 whitespace-nowrap overflow-hidden text-ellipsis ">{item.file_size || "—"}</div>
                <div className="p-3 flex items-center">{renderTranscriptionContent()}</div>
                {/* CHANGED: Removed opacity-0 and group-hover:opacity-100 to make the menu always visible */}
                <div className="p-3 flex items-center justify-center">
                    {actionMenu}
                </div>
            </div>
        </div>
    );
};

export default DriveFileItem;