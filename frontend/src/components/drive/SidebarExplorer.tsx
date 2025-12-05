import React, { useState, useRef } from "react";
import { Search, Plus, Upload, RefreshCw, PanelLeftClose, Mic, Square } from "lucide-react";
import { type FileData } from "../../services/filesService";
import { getFileIcon } from "../../utils/fileUtils";

interface SidebarExplorerProps {
    files: FileData[];
    activeFileId: string | null;
    onFileClick: (file: FileData) => void;
    onFileDoubleClick: (file: FileData) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreateFile: () => void;
    onRefresh: () => void;
    onCloseSidebar: () => void;
    isRecording: boolean;
    onToggleRecording: () => void;
    isFileDirty: (id: string) => boolean;
}

const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
                                                             files, activeFileId, onFileClick, onFileDoubleClick, onUpload, onCreateFile, onRefresh,
                                                             onCloseSidebar, isRecording, onToggleRecording, isFileDirty
                                                         }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full bg-muted/10 border-r border-border shrink-0 text-left">
            {/* Header Section */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/50 bg-muted/20">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
                <div className="flex gap-1">
                    <button
                        onClick={onToggleRecording}
                        className={`p-2 hover:bg-muted rounded transition-colors ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={18}/>}
                    </button>
                    <button onClick={onCreateFile} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="New File"><Plus size={18}/></button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Upload File"><Upload size={18}/></button>
                    <button onClick={onRefresh} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Refresh"><RefreshCw size={18}/></button>
                    <button onClick={onCloseSidebar} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Hide Sidebar"><PanelLeftClose size={18}/></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={onUpload} />
            </div>

            {/* Search Section */}
            <div className="px-4 py-3 border-b border-border/50">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Search..." className="w-full bg-background border border-input rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-1 focus:ring-ring" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {filteredFiles.map(file => (
                    <div
                        key={file.file_id}
                        className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer text-base border-l-4 transition-colors select-none ${activeFileId === file.file_id ? 'bg-primary/10 border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                        onClick={() => onFileClick(file)}
                        onDoubleClick={() => onFileDoubleClick(file)}
                    >
                        {/* Note: You might want to make the getFileIcon return larger icons as well, usually by passing a size prop if your utility supports it, or wrapping it in a div with text-lg */}
                        <span className="shrink-0 opacity-80 scale-110">{getFileIcon(file.filename)}</span>
                        <span className="truncate flex-1">{file.filename}</span>
                        {isFileDirty(file.file_id) && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SidebarExplorer;