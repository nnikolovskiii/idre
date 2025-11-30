import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { PanelLeft, FolderOpen } from "lucide-react";

import { fileService, type FileData } from "../services/filesService";
import Layout from "../components/layout/Layout";
import { useChats } from "../hooks/useChats";
import { useAuth } from "../contexts/AuthContext";

// Child Components
import SidebarExplorer from "../components/drive/SidebarExplorer";
import FileTabs from "../components/drive/FileTabs";
import MarkdownEditor from "../components/drive/editor/MarkdownEditor";

const MyDriveView = () => {
    const { notebookId } = useParams<{ notebookId: string }>();

    // --- DATA STATE ---
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);

    // --- TABS & CONTENT STATE ---
    const [openFiles, setOpenFiles] = useState<FileData[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [previewFileId, setPreviewFileId] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Record<string, string>>({});

    // --- MODAL STATE ---
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

    // --- PERSISTENCE STATE ---
    const hasRestoredTabs = useRef(false);

    // --- UI STATE ---
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // --- RECORDING STATE ---
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // --- HOOKS ---
    const { chatSessions, currentChatId, loadingChats, creatingChat, isTyping, createNewChat, switchToChat, handleDeleteChat } = useChats(notebookId);
    const { isAuthenticated, user } = useAuth();

    // --- FETCHING ---
    const fetchFiles = useCallback(async () => {
        if (!notebookId) return;
        setLoading(true);
        try {
            const res = await fileService.getUserFiles(notebookId);
            setFiles(res.data);
        } catch (err) {
            console.error("Failed to load files", err);
        } finally {
            setLoading(false);
        }
    }, [notebookId]);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // --- HELPERS ---
    const activeFile = openFiles.find(f => f.file_id === activeFileId) || null;

    const isFileDirty = (fileId: string) => {
        const file = files.find(f => f.file_id === fileId);
        const currentContent = fileContents[fileId];
        if (!file || currentContent === undefined) return false;
        return (file.content || "") !== currentContent;
    };

    // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        if (loading || files.length === 0 || !notebookId || hasRestoredTabs.current) return;

        const storageKey = `notebook_tabs_${notebookId}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
            try {
                const { openIds, activeId, previewId } = JSON.parse(savedData);
                const restoredFiles = files.filter(f => openIds.includes(f.file_id));

                if (restoredFiles.length > 0) {
                    setOpenFiles(restoredFiles);
                    const contentMap: Record<string, string> = {};
                    restoredFiles.forEach(f => {
                        contentMap[f.file_id] = f.content || "";
                    });
                    setFileContents(prev => ({ ...prev, ...contentMap }));

                    if (activeId && restoredFiles.find(f => f.file_id === activeId)) {
                        setActiveFileId(activeId);
                        const activeFile = restoredFiles.find(f => f.file_id === activeId);
                        if (activeFile?.filename.endsWith('.md')) setViewMode('split');
                    } else {
                        setActiveFileId(restoredFiles[0].file_id);
                    }

                    if (previewId && restoredFiles.find(f => f.file_id === previewId)) {
                        setPreviewFileId(previewId);
                    }
                }
            } catch (e) {
                localStorage.removeItem(storageKey);
            }
        }
        hasRestoredTabs.current = true;
    }, [files, loading, notebookId]);

    useEffect(() => {
        if (loading || !notebookId) return;
        if (files.length > 0 && !hasRestoredTabs.current) return;

        const dataToSave = {
            openIds: openFiles.map(f => f.file_id),
            activeId: activeFileId,
            previewId: previewFileId
        };

        localStorage.setItem(`notebook_tabs_${notebookId}`, JSON.stringify(dataToSave));
    }, [openFiles, activeFileId, previewFileId, notebookId, loading, files.length]);


    // --- FILE OPERATIONS ---
    const handleOpenFile = (file: FileData) => {
        if (fileContents[file.file_id] === undefined) {
            setFileContents(prev => ({ ...prev, [file.file_id]: file.content || "" }));
        }

        const isAlreadyOpen = openFiles.some(f => f.file_id === file.file_id);

        if (isAlreadyOpen) {
            setActiveFileId(file.file_id);
        } else {
            if (previewFileId && !isFileDirty(previewFileId)) {
                setOpenFiles(prev => prev.map(f => f.file_id === previewFileId ? file : f));
            } else {
                if (previewFileId && isFileDirty(previewFileId)) {
                    setPreviewFileId(null);
                }
                setOpenFiles(prev => [...prev, file]);
            }
            setPreviewFileId(file.file_id);
            setActiveFileId(file.file_id);
        }

        if (file.filename.endsWith('.md')) setViewMode('split');
        else setViewMode('edit');
    };

    const handlePinFile = (fileId: string) => {
        if (previewFileId === fileId) {
            setPreviewFileId(null);
        }
    };

    const handleDoubleClickFile = (file: FileData) => {
        if (fileContents[file.file_id] === undefined) {
            setFileContents(prev => ({ ...prev, [file.file_id]: file.content || "" }));
        }
        if (!openFiles.find(f => f.file_id === file.file_id)) {
            setOpenFiles(prev => [...prev, file]);
        }
        setActiveFileId(file.file_id);
        setPreviewFileId(null);
        if (file.filename.endsWith('.md')) setViewMode('split');
        else setViewMode('edit');
    };

    const handleEditorChange = (val: string) => {
        if (activeFileId) {
            setFileContents(prev => ({ ...prev, [activeFileId]: val }));
            if (activeFileId === previewFileId) setPreviewFileId(null);
        }
    };

    const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (isFileDirty(fileId)) {
            if (!confirm(`Save changes before closing?`)) return;
        }
        const newOpenFiles = openFiles.filter(f => f.file_id !== fileId);
        setOpenFiles(newOpenFiles);
        if (previewFileId === fileId) setPreviewFileId(null);
        setFileContents(prev => {
            const next = { ...prev };
            delete next[fileId];
            return next;
        });
        if (activeFileId === fileId) {
            setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].file_id : null);
        }
    };

    const handleSave = async () => {
        if (!activeFile || !activeFileId) return;
        const contentToSave = fileContents[activeFileId];
        try {
            await fileService.updateFile(activeFileId, { content: contentToSave });
            const updatedFile = { ...activeFile, content: contentToSave };
            setFiles(prev => prev.map(f => f.file_id === activeFileId ? updatedFile : f));
            setOpenFiles(prev => prev.map(f => f.file_id === activeFileId ? updatedFile : f));
        } catch (err) {
            alert("Failed to save file.");
        }
    };

    // --- DELETE LOGIC (Trigger Modal) ---
    const initiateDelete = () => {
        if (activeFile) {
            setFileToDelete(activeFile);
        }
    };

    // --- DELETE LOGIC (Execute) ---
    const confirmDelete = async () => {
        if (!fileToDelete) return;

        try {
            await fileService.deleteFile(fileToDelete.file_id);
            setFiles(prev => prev.filter(f => f.file_id !== fileToDelete.file_id));
            setOpenFiles(prev => prev.filter(f => f.file_id !== fileToDelete.file_id));

            if (previewFileId === fileToDelete.file_id) setPreviewFileId(null);
            if (activeFileId === fileToDelete.file_id) setActiveFileId(null);

            setFileToDelete(null); // Close modal
        } catch (err) {
            alert("Failed to delete file");
            setFileToDelete(null);
        }
    };

    const handleDownload = () => {
        if (activeFile) window.open(activeFile.url, '_blank');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !notebookId) return;
        await fileService.uploadFile(e.target.files[0], notebookId);
        await fetchFiles();
    };

    const handleCreateFile = async () => {
        const name = prompt("Enter file name (e.g., notes.md):");
        if (!name || !notebookId) return;
        const emptyFile = new File([""], name, { type: "text/plain" });
        await fileService.uploadFile(emptyFile, notebookId);
        await fetchFiles();
    };

    const startRecording = async () => { /* ...existing... */
        if (!notebookId) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `recording-${timestamp}.webm`;
                const file = new File([audioBlob], filename, { type: 'audio/webm' });
                try {
                    setLoading(true);
                    await fileService.uploadFile(file, notebookId);
                    await fetchFiles();
                } catch (err) { alert("Failed to upload recording"); } finally { setLoading(false); }
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) { alert("Could not access microphone."); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // --- RESIZER LOGIC ---
    const startResizing = useCallback(() => setIsDragging(true), []);
    const stopResizing = useCallback(() => setIsDragging(false), []);
    const resize = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const w = e.clientX - 60;
            if (w > 180 && w < 600) setSidebarWidth(w);
        }
    }, [isDragging]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const renderWorkspace = () => {
        if (!activeFile) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 bg-muted/5">
                    <FolderOpen size={48} className="opacity-40" />
                    <p>Select a file to open</p>
                </div>
            );
        }
        const isImage = activeFile.content_type.startsWith('image/');
        const isText = !isImage;

        if (isText) {
            return (
                <MarkdownEditor
                    content={fileContents[activeFile.file_id] || ""}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                    viewMode={viewMode}
                />
            );
        }
        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-muted/10">
                    <img src={activeFile.url} alt={activeFile.filename} className="max-w-full max-h-full object-contain shadow-lg" />
                </div>
            );
        }
        return <div className="p-10 text-center">Preview not available</div>;
    };

    return (
        <Layout
            notebookId={notebookId}
            title="Files"
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            loadingChats={loadingChats}
            creatingChat={creatingChat}
            isTyping={isTyping}
            isAuthenticated={isAuthenticated}
            user={user}
            createNewChat={createNewChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
        >
            <div className="flex h-full w-full bg-background overflow-hidden relative">
                {isSidebarVisible && (
                    <div style={{ width: sidebarWidth }} className="h-full shrink-0">
                        <SidebarExplorer
                            files={files}
                            activeFileId={activeFileId}
                            onFileClick={handleOpenFile}
                            onFileDoubleClick={handleDoubleClickFile}
                            onUpload={handleFileUpload}
                            onCreateFile={handleCreateFile}
                            onRefresh={fetchFiles}
                            onCloseSidebar={() => setIsSidebarVisible(false)}
                            isRecording={isRecording}
                            onToggleRecording={isRecording ? stopRecording : startRecording}
                            isFileDirty={isFileDirty}
                        />
                    </div>
                )}

                {isSidebarVisible ? (
                    <div className="w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors shrink-0 z-10 bg-border/30" onMouseDown={startResizing} />
                ) : (
                    <div className="w-10 border-r border-border bg-muted/10 flex flex-col items-center py-2 shrink-0">
                        <button onClick={() => setIsSidebarVisible(true)} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Open Explorer">
                            <PanelLeft size={20} />
                        </button>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-background h-full">
                    <FileTabs
                        openFiles={openFiles}
                        activeFileId={activeFileId}
                        previewFileId={previewFileId}
                        setActiveFileId={setActiveFileId}
                        onCloseTab={handleCloseTab}
                        onPinTab={handlePinFile}
                        isFileDirty={isFileDirty}
                        activeFile={activeFile}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        onSave={handleSave}
                        onDownload={handleDownload}
                        onDelete={initiateDelete} // CHANGED: Calls initiateDelete now
                    />

                    <div className="flex-1 overflow-hidden relative">
                        {renderWorkspace()}
                    </div>
                </div>

                {/* DELETE CONFIRMATION MODAL */}
                {fileToDelete && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <div className="bg-popover border border-border shadow-2xl rounded-lg w-full max-w-sm p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-semibold mb-2 text-popover-foreground">Delete File?</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Are you sure you want to delete <span className="font-medium text-foreground">{fileToDelete.filename}</span>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setFileToDelete(null)}
                                    className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyDriveView;