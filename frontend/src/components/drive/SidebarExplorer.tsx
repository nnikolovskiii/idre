import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    Search, Plus, Upload, RefreshCw, PanelLeftClose, Loader2,
    Folder, FolderOpen, FolderPlus,
    Edit3, Trash2, Download, X, ChevronRight, ChevronDown
} from "lucide-react";
import { type FileData, type FolderData } from "../../services/filesService";
import { getFileIcon } from "../../utils/fileUtils";
import ContextMenu, { type ContextMenuItem } from "../ui/ContextMenu";

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
    onMoveFile: (fileId: string, folderId: string | null) => void;
    onFileDelete: (fileId: string, fileName: string) => void;
    onFileRename: (fileId: string, newName: string) => void;
    onFileDownload: (fileId: string, filename: string) => void;
    onFolderDelete: (folderId: string, folderName: string) => void;
    onFolderRename: (folderId: string, newName: string) => void;
    // Bulk operations
    onBulkDelete?: (items: { type: 'file' | 'folder', id: string, name: string }[]) => void;
    onBulkDownload?: (files: { id: string, name: string }[]) => void;
}

interface TreeItem {
    id: string;
    type: 'folder' | 'file';
    name: string;
    data?: any;
    children: TreeItem[];
    parentId: string | null;
}

const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
                                                             files, folders, activeFileId, onFileClick, onFileDoubleClick,
                                                             onUpload, onCreateFile, onCreateFolder, onRefresh, onCloseSidebar, isFileDirty,
                                                             setCurrentFolderId, onMoveFile, onFileDelete, onFileRename,
                                                             onFileDownload, onFolderDelete, onFolderRename, onBulkDelete, onBulkDownload
                                                         }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isNewFolderInputVisible, setIsNewFolderInputVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // DRAG STATE
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

    // CONTEXT MENU STATE
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        itemId: string | null;
        type: 'file' | 'folder' | 'mixed' | null;
    }>({
        visible: false,
        x: 0,
        y: 0,
        itemId: null,
        type: null,
    });

    // RENAME STATE
    const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
    const [renamingItemName, setRenamingItemName] = useState("");

    // MULTI-SELECT STATE
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

    // --- TREE BUILDING ---
    const tree = useMemo(() => {
        const itemMap = new Map<string, TreeItem>();
        const rootItems: TreeItem[] = [];

        folders.forEach(f => {
            itemMap.set(f.id, {
                id: f.id,
                type: 'folder',
                name: f.name,
                data: f,
                children: [],
                parentId: f.parent_id
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
                children: [],
                parentId: f.folder_id
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

    // Flatten for Shift+Click
    const getFlatVisibleItems = useCallback(() => {
        const result: string[] = [];
        const traverse = (items: TreeItem[]) => {
            items.forEach(item => {
                result.push(item.id);
                if (item.type === 'folder' && (expandedFolders.has(item.id) || searchQuery)) {
                    traverse(item.children);
                }
            });
        };
        traverse(tree);
        return result;
    }, [tree, expandedFolders, searchQuery]);

    // --- SELECTION LOGIC ---
    const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
        setLastSelectedItem(null);
    }, []);

    const handleSelectionClick = useCallback((e: React.MouseEvent, itemId: string) => {
        if (e.shiftKey) {
            document.getSelection()?.removeAllRanges();
        }

        if (e.ctrlKey || e.metaKey) {
            setSelectedItems(prev => {
                const newSet = new Set(prev);
                if (newSet.has(itemId)) newSet.delete(itemId);
                else newSet.add(itemId);
                return newSet;
            });
            setLastSelectedItem(itemId);
        } else if (e.shiftKey && lastSelectedItem) {
            const flatList = getFlatVisibleItems();
            const lastIndex = flatList.indexOf(lastSelectedItem);
            const currentIndex = flatList.indexOf(itemId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                const rangeIds = flatList.slice(start, end + 1);

                setSelectedItems(prev => {
                    const newSet = new Set(prev);
                    rangeIds.forEach(id => newSet.add(id));
                    return newSet;
                });
            }
        } else {
            setSelectedItems(new Set([itemId]));
            setLastSelectedItem(itemId);
        }
    }, [lastSelectedItem, getFlatVisibleItems]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    const allIds = getFlatVisibleItems();
                    setSelectedItems(new Set(allIds));
                }
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && selectedItems.size > 0) {
                    e.preventDefault();
                    triggerBulkDelete();
                }
            }
            if (e.key === 'Escape' && selectedItems.size > 0) {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItems, getFlatVisibleItems]);

    // --- DRAG HANDLERS ---
    const handleDragStart = (e: React.DragEvent, fileId: string) => {
        if (selectedItems.size > 1 && selectedItems.has(fileId)) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("fileId", fileId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragOverFolderId !== folderId) setDragOverFolderId(folderId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);
        const fileId = e.dataTransfer.getData("fileId");
        if (fileId) {
            const file = files.find(f => f.file_id === fileId);
            if (file && file.folder_id !== targetFolderId) {
                onMoveFile(fileId, targetFolderId);
            }
        }
    };

    // --- CONTEXT MENU & BULK ACTIONS ---
    const triggerBulkDelete = () => {
        if (!onBulkDelete || selectedItems.size === 0) return;
        if (selectedItems.size === 1) {
            const id = Array.from(selectedItems)[0];
            const file = files.find(f => f.file_id === id);
            if (file) {
                onFileDelete(file.file_id, file.filename);
                return;
            }
            const folder = folders.find(f => f.id === id);
            if (folder) {
                onFolderDelete(folder.id, folder.name);
                return;
            }
        }
        const itemsToDelete: { type: 'file' | 'folder', id: string, name: string }[] = [];
        selectedItems.forEach(id => {
            const file = files.find(f => f.file_id === id);
            if (file) itemsToDelete.push({ type: 'file', id: file.file_id, name: file.filename });
            else {
                const folder = folders.find(f => f.id === id);
                if (folder) itemsToDelete.push({ type: 'folder', id: folder.id, name: folder.name });
            }
        });
        onBulkDelete(itemsToDelete);
        closeContextMenu();
        clearSelection();
    };

    const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder', itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedItems.has(itemId)) {
            setSelectedItems(new Set([itemId]));
            setLastSelectedItem(itemId);
        }
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            itemId: itemId,
            type: selectedItems.size > 1 ? 'mixed' : type
        });
    };

    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };

    const getContextMenuItems = (): ContextMenuItem[] => {
        if (selectedItems.size > 1) {
            const items: ContextMenuItem[] = [];
            const selectedArray = Array.from(selectedItems);
            const fileCount = selectedArray.filter(id => files.some(f => f.file_id === id)).length;

            if (fileCount > 0 && onBulkDownload) {
                items.push({
                    label: `Download ${fileCount} File${fileCount !== 1 ? 's' : ''}`,
                    icon: <Download size={14} />,
                    onClick: () => {
                        const filesToDownload = selectedArray
                            .map(id => files.find(f => f.file_id === id))
                            .filter(f => f !== undefined)
                            .map(f => ({ id: f!.file_id, name: f!.filename }));
                        onBulkDownload(filesToDownload);
                        closeContextMenu();
                    }
                });
            }
            items.push({
                label: `Delete ${selectedItems.size} Items`,
                icon: <Trash2 size={14} />,
                danger: true,
                onClick: triggerBulkDelete
            });
            return items;
        }

        const targetId = contextMenu.itemId;
        if (!targetId) return [];

        const isFolder = folders.some(f => f.id === targetId);
        const name = isFolder
            ? folders.find(f => f.id === targetId)?.name || ""
            : files.find(f => f.file_id === targetId)?.filename || "";

        const items: ContextMenuItem[] = [
            {
                label: 'Rename',
                icon: <Edit3 size={14} />,
                onClick: () => {
                    setRenamingItemId(targetId);
                    setRenamingItemName(name);
                    closeContextMenu();
                }
            }
        ];

        if (!isFolder) {
            items.push({
                label: 'Download',
                icon: <Download size={14} />,
                onClick: () => {
                    onFileDownload(targetId, name);
                    closeContextMenu();
                }
            });
        }

        items.push({
            label: 'Delete',
            icon: <Trash2 size={14} />,
            danger: true,
            onClick: () => {
                if (isFolder) onFolderDelete(targetId, name);
                else onFileDelete(targetId, name);
                closeContextMenu();
            }
        });
        return items;
    };

    // --- RENAME HANDLERS ---
    const confirmRename = () => {
        if (renamingItemId && renamingItemName.trim()) {
            const isFile = files.some(f => f.file_id === renamingItemId);
            if (isFile) {
                onFileRename(renamingItemId, renamingItemName.trim());
            } else {
                onFolderRename(renamingItemId, renamingItemName.trim());
            }
        }
        setRenamingItemId(null);
        setRenamingItemName("");
    };

    // --- RENDERERS ---
    const renderTree = (items: TreeItem[], level: number = 0) => {
        return items.map(item => {
            const isSelected = selectedItems.has(item.id);
            const isRenaming = renamingItemId === item.id;

            if (item.type === 'folder') {
                const isOpen = expandedFolders.has(item.id) || !!searchQuery;
                const isDragOver = dragOverFolderId === item.id;

                return (
                    <div key={item.id} className="select-none">
                        <div
                            className={`flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer transition-colors border-l-2
                                ${isSelected
                                ? 'bg-primary/20 border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }
                                ${isDragOver ? 'bg-primary/10 border-primary/50' : ''}
                            `}
                            style={{ paddingLeft: `${level * 12 + 4}px` }}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                    e.stopPropagation();
                                    handleSelectionClick(e, item.id);
                                } else {
                                    e.stopPropagation();
                                    setSelectedItems(new Set([item.id]));
                                    setLastSelectedItem(item.id);
                                    setCurrentFolderId(item.id);
                                    toggleFolder(item.id);
                                }
                            }}
                            onContextMenu={(e) => handleContextMenu(e, 'folder', item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, item.id)}
                        >
                            <span className="shrink-0 text-muted-foreground opacity-70">
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            <span className={`shrink-0 ${isSelected ? 'text-primary' : 'text-yellow-500/90'}`}>
                                {isOpen ? <FolderOpen size={16} fill="currentColor" /> : <Folder size={16} fill="currentColor" />}
                            </span>

                            {isRenaming ? (
                                <input
                                    type="text"
                                    className="flex-1 min-w-0 text-sm font-medium bg-background border border-primary rounded-sm px-1 py-0 outline-none h-5"
                                    value={renamingItemName}
                                    onChange={(e) => setRenamingItemName(e.target.value)}
                                    onBlur={() => setRenamingItemId(null)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.stopPropagation(); confirmRename(); }
                                        if (e.key === 'Escape') { e.stopPropagation(); setRenamingItemId(null); }
                                    }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="truncate text-sm font-medium">{item.name}</span>
                            )}
                        </div>
                        {isOpen && (
                            <div>
                                {item.children.length > 0 ? renderTree(item.children, level + 1) : null}
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
                        draggable={!isProcessing && !isRenaming}
                        onDragStart={(e) => handleDragStart(e, file.file_id)}
                        className={`flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-sm border-l-2
                            ${isSelected
                            ? 'bg-primary/20 border-primary text-foreground'
                            : isActive
                                ? 'bg-muted/40 border-transparent text-primary'
                                : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }
                            ${isProcessing ? 'cursor-not-allowed opacity-70' : ''}
                        `}
                        style={{ paddingLeft: `${level * 12 + 24}px` }}
                        onClick={(e) => {
                            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                e.stopPropagation();
                                handleSelectionClick(e, file.file_id);
                            } else {
                                e.stopPropagation();
                                setSelectedItems(new Set([file.file_id]));
                                setLastSelectedItem(file.file_id);
                                if (!isProcessing) onFileClick(file);
                            }
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!isProcessing) onFileDoubleClick(file);
                        }}
                        onContextMenu={(e) => !isProcessing && handleContextMenu(e, 'file', file.file_id)}
                    >
                        <span className="shrink-0 opacity-80">
                            {isProcessing ? <Loader2 className="animate-spin text-primary" size={14} /> : getFileIcon(file.filename)}
                        </span>

                        {isRenaming ? (
                            <input
                                type="text"
                                className="flex-1 min-w-0 text-sm bg-background border border-primary rounded-sm px-1 py-0 outline-none h-5"
                                value={renamingItemName}
                                onChange={(e) => setRenamingItemName(e.target.value)}
                                onBlur={() => setRenamingItemId(null)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.stopPropagation(); confirmRename(); }
                                    if (e.key === 'Escape') { e.stopPropagation(); setRenamingItemId(null); }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className={`truncate flex-1 ${isActive && !isSelected ? 'text-primary' : ''}`}>{file.filename}</span>
                        )}
                        {isFileDirty(file.file_id) && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                );
            }
        });
    };

    const toggleFolder = (folderId: string) => {
        const next = new Set(expandedFolders);
        if (next.has(folderId)) next.delete(folderId);
        else next.add(folderId);
        setExpandedFolders(next);
    };

    const submitNewFolder = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim());
            setNewFolderName("");
            setIsNewFolderInputVisible(false);
        }
    };

    return (
        <div
            className="flex flex-col h-full bg-muted/10 border-r border-border shrink-0 text-left w-full select-none"
            onClick={() => clearSelection()}
            onDragOver={(e) => { e.preventDefault(); if(dragOverFolderId) setDragOverFolderId(null); }}
            onDrop={(e) => handleDrop(e, null)}
        >
            {/* Header */}
            <div className="flex flex-col bg-muted/20" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-3 py-1.5 h-9">
                    {selectedItems.size > 1 ? (
                        <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
                            <div className="flex items-center gap-2">
                                <button onClick={clearSelection} className="hover:bg-muted p-1 rounded-sm">
                                    <X size={14} />
                                </button>
                                <span className="text-xs font-semibold text-primary">
                                    {selectedItems.size} selected
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {onBulkDownload && (
                                    <button
                                        onClick={() => {
                                            const filesToDL = Array.from(selectedItems)
                                                .map(id => files.find(f => f.file_id === id))
                                                .filter(f => f !== undefined)
                                                .map(f => ({id: f!.file_id, name: f!.filename}));
                                            if(filesToDL.length > 0) onBulkDownload(filesToDL);
                                        }}
                                        className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground"
                                        title="Download Selected"
                                    >
                                        <Download size={14}/>
                                    </button>
                                )}
                                <button
                                    onClick={triggerBulkDelete}
                                    className="p-1 hover:bg-destructive/10 rounded-sm text-destructive hover:text-destructive"
                                    title="Delete Selected"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Explorer</span>
                            <div className="flex gap-0.5">
                                <button onClick={() => setIsNewFolderInputVisible(true)} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title="New Folder">
                                    <FolderPlus size={16}/>
                                </button>
                                <button onClick={onCreateFile} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title="New Document">
                                    <Plus size={16}/>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title="Upload">
                                    <Upload size={16}/>
                                </button>
                                <button onClick={onRefresh} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
                                    <RefreshCw size={14}/>
                                </button>
                                <button onClick={onCloseSidebar} className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <PanelLeftClose size={16}/>
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={onUpload} />
                        </>
                    )}
                </div>

                {/* Search Bar - only show if items exist */}
                {(files.length > 0 || folders.length > 0) && (
                    <div className="px-2 pb-2">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-background border border-input rounded-sm pl-7 pr-2 py-0.5 text-xs focus:ring-1 focus:ring-ring focus:border-primary outline-none placeholder:text-muted-foreground/50 h-6"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Folder Creation Input */}
            {isNewFolderInputVisible && (
                <div className="px-2 py-1 border-b border-border bg-background" onClick={e => e.stopPropagation()}>
                    <form onSubmit={submitNewFolder} className="flex gap-1">
                        <input
                            autoFocus
                            type="text"
                            className="flex-1 text-xs border border-primary rounded-sm px-1.5 py-0.5 outline-none bg-background h-6"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onBlur={() => !newFolderName && setIsNewFolderInputVisible(false)}
                        />
                        <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 rounded-sm h-6">Add</button>
                    </form>
                </div>
            )}

            {/* Tree List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 pt-1">
                {/* ROOT DROP ZONE (Hidden unless dragging) */}
                <div
                    className={`
                        mx-2 px-2 py-1 text-xs font-semibold text-muted-foreground mb-1 rounded-sm
                        transition-colors border border-dashed border-transparent
                        ${dragOverFolderId === 'ROOT' ? 'border-primary bg-primary/10 text-primary block' : 'hidden'}
                    `}
                    onDragOver={(e) => handleDragOver(e, 'ROOT')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    Move to Root
                </div>

                {renderTree(tree)}

                {tree.length === 0 && (
                    <div className="text-center p-8 text-xs text-muted-foreground flex flex-col items-center gap-2 opacity-60">
                        <div className="p-3 rounded-full bg-muted/50"><FolderOpen size={24} /></div>
                        <p>No files found</p>
                    </div>
                )}
            </div>

            {/* CONTEXT MENU */}
            <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                items={getContextMenuItems()}
                onClose={closeContextMenu}
            />
        </div>
    );
};

export default SidebarExplorer;