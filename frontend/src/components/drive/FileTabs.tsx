import React from "react";
import { X, Save, Download, Trash2, FileCode, Columns, Eye, Mic, Square, Loader2 } from "lucide-react";
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
    // Recording Props
    isRecording: boolean;
    onToggleRecording: () => void;
    isTranscribingForFile?: boolean;
}
const FileTabs: React.FC<FileTabsProps> = ({
                                               openFiles, activeFileId, previewFileId, setActiveFileId, onCloseTab, onPinTab, isFileDirty,
                                               activeFile, viewMode, setViewMode, onSave, onDownload, onDelete,
                                               isRecording, onToggleRecording, isTranscribingForFile
                                           }) => {
    // Only show recording for text files
    const isTextFile = activeFile && !activeFile.content_type.startsWith('image/');
    return (
        <div className="flex h-12 bg-muted/20 border-b border-border shrink-0">
            <div className="flex-1 flex overflow-x-auto no-scrollbar">
                {openFiles.map(file => (
                    <div
                        key={file.file_id}
                        className={`group flex items-center gap-2.5 px-4 min-w-[150px] max-w-[240px] h-full border-r border-border/50 text-sm cursor-pointer select-none border-t-2 
                        ${activeFileId === file.file_id ? 'bg-background border-t-primary text-foreground' : 'bg-transparent border-t-transparent text-muted-foreground hover:bg-muted/30'}
                        ${previewFileId === file.file_id ? 'italic' : ''}
                        `}
                        onClick={() => setActiveFileId(file.file_id)}
                        onDoubleClick={() => onPinTab(file.file_id)}
                        title={previewFileId === file.file_id ? "Preview (Double-click to pin)" : file.filename}
                    >
                        <span className="opacity-80 scale-110">{getFileIcon(file.filename)}</span>
                        <span className="truncate flex-1">{file.filename}</span>
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            {isFileDirty(file.file_id) ? <div className="group-hover:hidden w-2.5 h-2.5 rounded-full bg-foreground/70" /> : null}
                            <button onClick={(e) => onCloseTab(e, file.file_id)} className={`p-1 rounded-sm hover:bg-muted-foreground/20 text-muted-foreground/70 hover:text-foreground ${isFileDirty(file.file_id) ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100'}`}><X size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {activeFile && (
                <div className="flex items-center gap-1 px-3 bg-muted/10 border-l border-border shrink-0">
                    {isTextFile && (
                        <>
                            {/* Add Voice Note Button - Only visible when a text file is open */}
                            <button
                                onClick={onToggleRecording}
                                className={`p-2 rounded mr-2 flex items-center gap-2 transition-colors ${isRecording ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                title={isRecording ? "Stop Recording" : "Add Voice Note to Document"}
                                disabled={isTranscribingForFile}
                            >
                                {isTranscribingForFile ? (
                                    <Loader2 size={18} className="animate-spin text-primary" />
                                ) : isRecording ? (
                                    <Square size={18} fill="currentColor" />
                                ) : (
                                    <Mic size={18} />
                                )}
                                {(isRecording || isTranscribingForFile) && (
                                    <span className="text-xs font-medium">
                                        {isRecording ? "Recording..." : "Transcribing..."}
                                    </span>
                                )}
                            </button>
                            <div className="w-px h-6 bg-border mx-1"></div>
                            <div className="flex bg-muted/30 rounded-md p-1 mr-3">
                                <button
                                    onClick={() => setViewMode('edit')}
                                    className={`p-2 rounded-sm transition-all ${viewMode === 'edit' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Edit Source"
                                >
                                    <FileCode size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`p-2 rounded-sm transition-all ${viewMode === 'split' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Split View"
                                >
                                    <Columns size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`p-2 rounded-sm transition-all ${viewMode === 'preview' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Preview Only"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                            <button
                                onClick={onSave}
                                className={`p-2 rounded transition-colors ${isFileDirty(activeFile.file_id) ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                title="Save (Ctrl+S)"
                            >
                                <Save size={18} />
                            </button>
                        </>
                    )}
                    <button onClick={onDownload} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title="Download"><Download size={18} /></button>
                    <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded" title="Delete"><Trash2 size={18} /></button>
                </div>
            )}
        </div>
    );
};
export default FileTabs;