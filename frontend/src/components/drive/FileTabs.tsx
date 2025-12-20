import React from "react";
import { X, Save, Download, Trash2, FileCode, Columns, Eye, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { type FileData } from "../../services/filesService";
import { getFileIcon } from "../../utils/fileUtils";

interface FileTabsProps {
    openFiles: FileData[];
    activeFileId: string | null;
    previewFileId: string | null;
    setActiveFileId: (id: string) => void;
    onCloseTab: (e: React.MouseEvent, id: string) => void;
    onPinTab: (id: string) => void;
    isFileDirty: (id: string) => boolean;
    // Toolbar Props
    activeFile: FileData | null;
    viewMode: 'edit' | 'preview' | 'split';
    setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
    onSave: () => void;
    onDownload: () => void;
    onDelete: () => void;
    // Zoom Props
    fontSize: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

const FileTabs: React.FC<FileTabsProps> = ({
                                               openFiles, activeFileId, previewFileId, setActiveFileId, onCloseTab, onPinTab, isFileDirty,
                                               activeFile, viewMode, setViewMode, onSave, onDownload, onDelete,
                                               fontSize, onZoomIn, onZoomOut, onZoomReset
                                           }) => {
    // Only show toolbar for text files
    const isTextFile = activeFile && !activeFile.content_type.startsWith('image/');

    return (
        <div className="flex h-10 bg-muted/40 border-b border-border shrink-0 select-none">
            {/* TABS CONTAINER */}
            <div className="flex-1 flex overflow-x-auto no-scrollbar items-end my-auto">
                {openFiles.map(file => {
                    const isActive = activeFileId === file.file_id;
                    const isPreview = previewFileId === file.file_id;
                    const isDirty = isFileDirty(file.file_id);

                    return (
                        <div
                            key={file.file_id}
                            className={`
                                group flex items-center gap-1 px-2 py-1
                                text-sm cursor-pointer rounded-md
                                ${isActive
                                ? 'bg-blue-600/40 border-blue-600 border-[1px] text-foreground'
                                : 'bg-transparent text-muted-foreground hover:bg-[#101012]'
                            }
                                ${isPreview ? 'italic' : ''}
                            `}
                            onClick={() => setActiveFileId(file.file_id)}
                            onDoubleClick={() => onPinTab(file.file_id)}
                            title={isPreview ? "Preview (Double-click to pin)" : file.filename}
                        >
                            <span className="opacity-80 shrink-0">{getFileIcon(file.filename)}</span>
                            <span className="truncate flex-1 text-xs">{file.filename}</span>

                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                {/*
                                   Dirty Dot Logic:
                                   Only show if dirty AND the tab is NOT active.
                                   If it is active, the X takes priority and is shown always.
                                */}
                                {isDirty && !isActive ? (
                                    <div className="w-2 h-2 rounded-full bg-foreground/70 group-hover:hidden" />
                                ) : null}

                                <button
                                    onClick={(e) => onCloseTab(e, file.file_id)}
                                    className={`
                                        p-0.5 rounded-sm hover:bg-muted-foreground/20 text-muted-foreground/70 hover:text-foreground
                                        ${isActive
                                        ? 'opacity-100' /* Active: Always visible */
                                        : isDirty
                                            ? 'hidden group-hover:block' /* Inactive & Dirty: Hidden (shows dot), visible on hover */
                                            : 'opacity-0 group-hover:opacity-100' /* Inactive & Clean: Invisible, visible on hover */
                                    }
                                    `}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ACTIONS TOOLBAR */}
            {activeFile && (
                <div className="flex items-center gap-0.5 px-2 bg-muted/40 border-l border-border shrink-0">
                    {isTextFile && (
                        <>
                            <div className="flex bg-muted/50 rounded-md p-0.5 mr-2">
                                <button
                                    onClick={() => setViewMode('edit')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'edit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Edit"
                                >
                                    <FileCode size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'split' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Split"
                                >
                                    <Columns size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Preview"
                                >
                                    <Eye size={16} />
                                </button>
                            </div>

                            {/* ZOOM CONTROLS */}
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={onZoomOut}
                                    disabled={fontSize <= 10}
                                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Zoom Out (Ctrl+-)"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <span className="text-xs text-muted-foreground font-mono min-w-[3ch] text-center">
                                    {Math.round((fontSize / 16) * 100)}%
                                </span>
                                <button
                                    onClick={onZoomIn}
                                    disabled={fontSize >= 32}
                                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Zoom In (Ctrl++)"
                                >
                                    <ZoomIn size={16} />
                                </button>
                                <button
                                    onClick={onZoomReset}
                                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                    title="Reset Zoom (Ctrl+0)"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>

                            <button
                                onClick={onSave}
                                className={`p-1.5 rounded transition-colors ${isFileDirty(activeFile.file_id) ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                title="Save (Ctrl+S)"
                            >
                                <Save size={16} />
                            </button>
                        </>
                    )}
                    <button onClick={onDownload} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title="Download"><Download size={16} /></button>
                    <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete"><Trash2 size={16} /></button>
                </div>
            )}
        </div>
    );
};

export default FileTabs;