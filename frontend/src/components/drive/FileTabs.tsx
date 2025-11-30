import React from "react";
import { X, Save, Download, Trash2, FileCode, Columns, Eye } from "lucide-react";
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
}

const FileTabs: React.FC<FileTabsProps> = ({
                                               openFiles, activeFileId, previewFileId, setActiveFileId, onCloseTab, onPinTab, isFileDirty,
                                               activeFile, viewMode, setViewMode, onSave, onDownload, onDelete
                                           }) => {

    // Treat everything as text unless it is strictly an image, so we can edit content/transcriptions
    const isText = activeFile && !activeFile.content_type.startsWith('image/');

    return (
        <div className="flex h-9 bg-muted/20 border-b border-border shrink-0">
            <div className="flex-1 flex overflow-x-auto no-scrollbar">
                {openFiles.map(file => (
                    <div
                        key={file.file_id}
                        className={`group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] h-full border-r border-border/50 text-xs cursor-pointer select-none border-t-2 
                        ${activeFileId === file.file_id ? 'bg-background border-t-primary text-foreground' : 'bg-transparent border-t-transparent text-muted-foreground hover:bg-muted/30'}
                        ${previewFileId === file.file_id ? 'italic' : ''}
                        `}
                        onClick={() => setActiveFileId(file.file_id)}
                        onDoubleClick={() => onPinTab(file.file_id)}
                        title={previewFileId === file.file_id ? "Preview (Double-click to pin)" : file.filename}
                    >
                        <span className="opacity-80">{getFileIcon(file.filename)}</span>
                        <span className="truncate flex-1">{file.filename}</span>
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {isFileDirty(file.file_id) ? <div className="group-hover:hidden w-2 h-2 rounded-full bg-foreground/70" /> : null}
                            <button onClick={(e) => onCloseTab(e, file.file_id)} className={`p-0.5 rounded-sm hover:bg-muted-foreground/20 text-muted-foreground/70 hover:text-foreground ${isFileDirty(file.file_id) ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'}`}><X size={12} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {activeFile && (
                <div className="flex items-center gap-1 px-2 bg-muted/10 border-l border-border shrink-0">
                    {isText && (
                        <>
                            <div className="flex bg-muted/30 rounded-md p-0.5 mr-2">
                                <button
                                    onClick={() => setViewMode('edit')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'edit' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Edit Source"
                                >
                                    <FileCode size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'split' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Split View"
                                >
                                    <Columns size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`p-1.5 rounded-sm transition-all ${viewMode === 'preview' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Preview Only"
                                >
                                    <Eye size={14} />
                                </button>
                            </div>

                            <button
                                onClick={onSave}
                                className={`p-1.5 rounded transition-colors ${isFileDirty(activeFile.file_id) ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                title="Save (Ctrl+S)"
                            >
                                <Save size={14} />
                            </button>
                        </>
                    )}
                    <button onClick={onDownload} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title="Download"><Download size={14} /></button>
                    <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete"><Trash2 size={14} /></button>
                </div>
            )}
        </div>
    );
};

export default FileTabs;