import React, { useState, useMemo, useRef } from "react";
import {
    Search, Plus, Upload, RefreshCw, PanelLeftClose, Loader2,
    Folder, FolderOpen, ChevronRight, ChevronDown, FolderPlus
} from "lucide-react";
import { type FileData, type FolderData } from "../../services/filesService";
import { getFileIcon } from "../../utils/fileUtils";

interface SidebarExplorerProps {
    files: FileData[];
    folders: FolderData[];
    activeFileId: string | null;
    onFileClick: (file: FileData) => void;
    onFileDoubleClick: (file: FileData) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreateFile: () => void;
    onCreateFolder: (name: string) => void;
    onRefresh: () => void;
    onCloseSidebar: () => void;
    isFileDirty: (id: string) => boolean;
    currentFolderId: string | null;
    setCurrentFolderId: (id: string | null) => void;
    onMoveFile: (fileId: string, folderId: string | null) => void; // <--- NEW PROP
}

interface TreeItem {
    id: string;
    type: 'folder' | 'file';
    name: string;
    data?: any;
    children: TreeItem[];
}

const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
                                                             files, folders, activeFileId, onFileClick, onFileDoubleClick,
                                                             onUpload, onCreateFile, onCreateFolder, onRefresh, onCloseSidebar, isFileDirty,
                                                             currentFolderId, setCurrentFolderId, onMoveFile // <--- Destructure
                                                         }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // DRAG STATE
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // --- DRAG HANDLERS ---

    const handleDragStart = (e: React.DragEvent, fileId: string) => {
        e.dataTransfer.setData("fileId", fileId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
        e.preventDefault(); // Necessary to allow dropping
        e.stopPropagation();
        if (dragOverFolderId !== folderId) {
            setDragOverFolderId(folderId);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only clear if we are actually leaving the drop zone (simple check)
        // setDragOverFolderId(null);
    };

    const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);

        const fileId = e.dataTransfer.getData("fileId");
        if (fileId) {
            // Prevent dropping a file onto its current folder (optional check)
            const file = files.find(f => f.file_id === fileId);
            if (file && file.folder_id !== targetFolderId) {
                onMoveFile(fileId, targetFolderId);
            }
        }
    };

    // --- END DRAG HANDLERS ---

    // Build the Tree (Same as before)
    const tree = useMemo(() => {
        const itemMap = new Map<string, TreeItem>();
        const rootItems: TreeItem[] = [];

        folders.forEach(f => {
            itemMap.set(f.id, {
                id: f.id,
                type: 'folder',
                name: f.name,
                data: f,
                children: []
            });
        });

        folders.forEach(f => {
            const item = itemMap.get(f.id)!;
            if (f.parent_id && itemMap.has(f.parent_id)) {
                itemMap.get(f.parent_id)!.children.push(item);
            } else {
                rootItems.push(item);
            }
        });

        files.forEach(f => {
            const fileItem: TreeItem = {
                id: f.file_id,
                type: 'file',
                name: f.filename,
                data: f,
                children: []
            };
            const pId = f.folder_id;
            if (pId && itemMap.has(pId)) {
                itemMap.get(pId)!.children.push(fileItem);
            } else {
                rootItems.push(fileItem);
            }
        });

        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            const filterRecursive = (items: TreeItem[]): TreeItem[] => {
                return items.reduce((acc, item) => {
                    if (item.type === 'file' && item.name.toLowerCase().includes(lowerQ)) {
                        acc.push(item);
                    } else if (item.type === 'folder') {
                        const filteredChildren = filterRecursive(item.children);
                        if (filteredChildren.length > 0 || item.name.toLowerCase().includes(lowerQ)) {
                            acc.push({ ...item, children: filteredChildren });
                        }
                    }
                    return acc;
                }, [] as TreeItem[]);
            };
            return filterRecursive(rootItems);
        }

        return rootItems;
    }, [files, folders, searchQuery]);

    const toggleFolder = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedFolders);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        setExpandedFolders(next);
    };

    const handleFolderSelect = (folderId: string | null) => {
        setCurrentFolderId(folderId);
        if (folderId && !expandedFolders.has(folderId)) {
            setExpandedFolders(prev => new Set(prev).add(folderId));
        }
    };

    const submitNewFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim());
            setNewFolderName("");
            setIsNewFolderInputVisible(false);
        }
    };

    // Recursive Renderer
    const renderTree = (items: TreeItem[], level: number = 0) => {
        return items.map(item => {
            if (item.type === 'folder') {
                const isOpen = expandedFolders.has(item.id) || !!searchQuery;
                const isSelected = currentFolderId === item.id;
                const isDragOver = dragOverFolderId === item.id;

                return (
                    <div key={item.id} className="select-none">
                        <div
                            className={`flex items-center gap-1 py-1 px-2 cursor-pointer transition-colors border-2 border-transparent
                                ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}
                                ${isDragOver ? 'border-primary/50 bg-primary/5' : ''}
                            `}
                            style={{ paddingLeft: `${level * 12 + 12}px` }}
                            onClick={() => handleFolderSelect(item.id)}
                            // FOLDER DROP HANDLERS
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, item.id)}
                        >
                            <span
                                onClick={(e) => toggleFolder(item.id, e)}
                                className="p-0.5 hover:bg-muted rounded"
                            >
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            <span className={`shrink-0 ${isDragOver ? 'text-primary' : 'text-yellow-500/80'}`}>
                                {isOpen || isDragOver ? <FolderOpen size={16} fill="currentColor" /> : <Folder size={16} fill="currentColor" />}
                            </span>
                            <span className="truncate text-sm font-medium">{item.name}</span>
                        </div>
                        {isOpen && (
                            <div>
                                {item.children.length > 0 ? renderTree(item.children, level + 1) : (
                                    <div className="text-xs text-muted-foreground/50 py-1" style={{ paddingLeft: `${(level + 1) * 12 + 30}px` }}>
                                        Empty
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            } else {
                const file = item.data as FileData;
                const isProcessing = file.processing_status === 'PROCESSING';
                const isActive = activeFileId === file.file_id;

                return (
                    <div
                        key={item.id}
                        draggable={!isProcessing} // MAKE FILE DRAGGABLE
                        onDragStart={(e) => handleDragStart(e, file.file_id)}
                        className={`flex items-center gap-2 py-1.5 pr-2 cursor-pointer text-sm border-l-2
                            ${isActive ? 'border-primary bg-muted/40 text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/30'}
                            ${isProcessing ? 'cursor-not-allowed opacity-70' : ''}
                        `}
                        style={{ paddingLeft: `${level * 12 + 30}px` }}
                        onClick={() => !isProcessing && onFileClick(file)}
                        onDoubleClick={() => !isProcessing && onFileDoubleClick(file)}
                    >
                        <span className="shrink-0 opacity-80">
                            {isProcessing ? <Loader2 className="animate-spin text-primary" size={14} /> : getFileIcon(file.filename)}
                        </span>
                        <span className="truncate flex-1">{file.filename}</span>
                        {isFileDirty(file.file_id) && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                );
            }
        });
    };

    return (
        <div
            className="flex flex-col h-full bg-muted/10 border-r border-border shrink-0 text-left w-full"
            onDragOver={(e) => {
                e.preventDefault();
                // Optional: Clear highlight if dragging over empty space
                if(dragOverFolderId) setDragOverFolderId(null);
            }}
        >
            {/* ... Header and Search ... */}
            <div className="flex flex-col border-b border-border/50 bg-muted/20">
                {/* (Header Code same as previous, omitted for brevity) */}
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
                    <div className="flex gap-0.5">
                        <button onClick={() => setIsNewFolderInputVisible(true)} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="New Folder">
                            <FolderPlus size={16}/>
                        </button>
                        <button onClick={onCreateFile} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="New Document">
                            <Plus size={16}/>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Upload">
                            <Upload size={16}/>
                        </button>
                        <button onClick={onRefresh} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Refresh">
                            <RefreshCw size={16}/>
                        </button>
                        <button onClick={onCloseSidebar} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                            <PanelLeftClose size={16}/>
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={onUpload} />
                </div>
                <div className="px-3 pb-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-background border border-input rounded-md pl-8 pr-2 py-1 text-xs focus:ring-1 focus:ring-ring"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Folder Creation Input */}
            {isNewFolderInputVisible && (
                <div className="p-2 border-b border-border bg-background">
                    <form onSubmit={submitNewFolder} className="flex gap-2">
                        <input
                            autoFocus
                            type="text"
                            className="flex-1 text-xs border rounded px-2 py-1"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onBlur={() => !newFolderName && setIsNewFolderInputVisible(false)}
                        />
                        <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 rounded">Add</button>
                    </form>
                </div>
            )}

            {/* Tree List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {/* ROOT DROP ZONE */}
                <div
                    className={`
                        px-3 py-1 text-xs font-semibold text-muted-foreground mb-1 cursor-pointer 
                        transition-colors border-2 border-transparent
                        ${currentFolderId === null ? 'bg-muted/50 text-foreground' : 'hover:bg-muted/30'}
                        ${dragOverFolderId === 'ROOT' ? 'border-primary/50 bg-primary/5 text-primary' : ''}
                    `}
                    onClick={() => handleFolderSelect(null)}
                    onDragOver={(e) => handleDragOver(e, 'ROOT')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    ROOT
                </div>

                {renderTree(tree)}

                {tree.length === 0 && (
                    <div className="text-center p-4 text-xs text-muted-foreground">No files</div>
                )}
            </div>
        </div>
    );
};

export default SidebarExplorer;