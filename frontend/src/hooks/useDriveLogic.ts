import { useState, useEffect, useCallback, useRef } from "react";
import { fileService, type FileData, type FolderData } from "../services/filesService";
import { API_CONFIG } from "../services/api";

export const useDriveLogic = (notebookId: string | undefined) => {
    // --- DATA STATE ---
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);

    // --- TABS & CONTENT STATE ---
    const [openFiles, setOpenFiles] = useState<FileData[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [previewFileId, setPreviewFileId] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Record<string, string>>({});

    // --- FOLDER STATE ---
    const [folders, setFolders] = useState<FolderData[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Ref to hold latest fileContents for SSE handler without re-triggering effect
    const fileContentsRef = useRef<Record<string, string>>({});
    useEffect(() => {
        fileContentsRef.current = fileContents;
    }, [fileContents]);

    // --- MODAL STATE ---
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");

    // --- UI STATE ---
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // --- RECORDING STATE ---
    const [isRecording, setIsRecording] = useState(false);
    const [transcribingFileId, setTranscribingFileId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    // REMOVED: const transcriptionQueue = useRef<Record<string, string>>({});

    // --- PERSISTENCE REF ---
    const hasRestoredTabs = useRef(false);

    // --- FETCHING ---
    const fetchFiles = useCallback(async () => {
        if (!notebookId) return;
        setLoading(true);
        try {
            const [filesRes, foldersRes] = await Promise.all([
                fileService.getUserFiles(notebookId),
                fileService.getFolders(notebookId)
            ]);
            setFiles(filesRes.data);
            setFolders(foldersRes);
        } catch (err) {
            console.error("Failed to load drive data", err);
        } finally {
            setLoading(false);
        }
    }, [notebookId]);

    const createFolder = async (name: string) => {
        if (!notebookId) return;
        try {
            const newFolder = await fileService.createFolder(notebookId, name, currentFolderId);
            setFolders(prev => [...prev, newFolder]);
        } catch (e) {
            alert("Failed to create folder");
        }
    };

    const moveFile = useCallback(async (fileId: string, targetFolderId: string | null) => {
        if (!notebookId) return;

        // 1. Optimistic UI Update
        setFiles(prev => prev.map(f => {
            if (f.file_id === fileId) {
                return { ...f, folder_id: targetFolderId };
            }
            return f;
        }));

        // 2. API Call
        try {
            await fileService.moveFile(fileId, targetFolderId);
        } catch (err) {
            console.error("Failed to move file", err);
            // Revert on failure (optional, but good practice)
            fetchFiles();
            alert("Failed to move file.");
        }
    }, [notebookId, fetchFiles]);

    // Initial fetch
    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // --- HELPERS ---
    const activeFile = openFiles.find(f => f.file_id === activeFileId) || null;

    const isFileDirty = useCallback((fileId: string) => {
        const file = files.find(f => f.file_id === fileId);
        const currentContent = fileContents[fileId];
        if (!file || currentContent === undefined) return false;
        return (file.content || "") !== currentContent;
    }, [files, fileContents]);

    // --- PERSISTENCE (Tabs) ---
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
                    restoredFiles.forEach(f => { contentMap[f.file_id] = f.content || ""; });
                    setFileContents(prev => ({ ...prev, ...contentMap }));

                    if (activeId && restoredFiles.find(f => f.file_id === activeId)) {
                        setActiveFileId(activeId);
                        const aFile = restoredFiles.find(f => f.file_id === activeId);
                        if (aFile?.filename.endsWith('.md')) setViewMode('split');
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
        if (loading || !notebookId || (files.length > 0 && !hasRestoredTabs.current)) return;
        const dataToSave = { openIds: openFiles.map(f => f.file_id), activeId: activeFileId, previewId: previewFileId };
        localStorage.setItem(`notebook_tabs_${notebookId}`, JSON.stringify(dataToSave));
    }, [openFiles, activeFileId, previewFileId, notebookId, loading, files.length]);

    // --- FILE OPERATIONS ---
    const handleVoiceUpload = useCallback(async (audioFile: File, targetTextFileId: string) => {
        if (!notebookId) return;
        try {
            setTranscribingFileId(targetTextFileId);
            // This returns the response data which includes file_id
            await fileService.uploadFile(
                audioFile,
                notebookId,
                true,
                true,
                null,
                targetTextFileId // <--- SEND TARGET FILE ID TO BACKEND
            );

            // REMOVED: queue logic. We trust the SSE event to come back with the update.

        } catch (err) {
            console.error("Voice upload failed", err);
            alert("Failed to upload voice recording. Please try again.");
            setTranscribingFileId(null);
        }
    }, [notebookId]);

    const handleFileUpload = useCallback(async (fileToUpload: File) => {
        if (!notebookId) return;
        try {
            const tempFileId = `temp-${Date.now()}`;
            // Optimistic update: Create a temp file object
            const tempFileData: FileData = {
                file_id: tempFileId,
                filename: fileToUpload.name,
                processing_status: 'PROCESSING',
                unique_filename: '',
                url: '',
                content_type: fileToUpload.type,
                file_size: '',
                content: '',
                thread_id: null,
                run_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                processing_result: null,
                folder_id: currentFolderId, // Explicitly set folder_id
            };
            setFiles(prevFiles => [tempFileData, ...prevFiles]);

            const newFileRecord = await fileService.uploadFile(
                fileToUpload, notebookId, true, false, currentFolderId
            );

            // Replace temp file with real file from response
            setFiles(prevFiles => prevFiles.map(f =>
                f.file_id === tempFileId ? {
                    ...f,
                    file_id: newFileRecord.file_id,
                    url: newFileRecord.url,
                    processing_status: newFileRecord.processing_status,
                } : f
            ));
        } catch (err) {
            console.error("File upload failed", err);
            alert("File upload failed. Please try again.");
            setFiles(prevFiles => prevFiles.filter(f => !f.file_id.startsWith('temp-')));
        }
    }, [notebookId, currentFolderId]);

    const onUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
        e.target.value = '';
    };

    const handleOpenFile = (file: FileData) => {
        if (file.processing_status === 'PROCESSING') return;
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
                if (previewFileId && isFileDirty(previewFileId)) setPreviewFileId(null);
                setOpenFiles(prev => [...prev, file]);
            }
            setPreviewFileId(file.file_id);
            setActiveFileId(file.file_id);
        }
        if (file.filename.endsWith('.md')) setViewMode('split'); else setViewMode('edit');
    };

    const handlePinFile = (fileId: string) => {
        if (previewFileId === fileId) setPreviewFileId(null);
    };

    const handleDoubleClickFile = (file: FileData) => {
        if (file.processing_status === 'PROCESSING') return;
        if (fileContents[file.file_id] === undefined) {
            setFileContents(prev => ({ ...prev, [file.file_id]: file.content || "" }));
        }
        if (!openFiles.find(f => f.file_id === file.file_id)) {
            setOpenFiles(prev => [...prev, file]);
        }
        setActiveFileId(file.file_id);
        setPreviewFileId(null);
        if (file.filename.endsWith('.md')) setViewMode('split'); else setViewMode('edit');
    };

    const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        if (isFileDirty(fileId) && !confirm(`Save changes before closing?`)) return;
        const newOpenFiles = openFiles.filter(f => f.file_id !== fileId);
        setOpenFiles(newOpenFiles);
        if (previewFileId === fileId) setPreviewFileId(null);
        const next = { ...fileContents };
        delete next[fileId];
        setFileContents(next);
        if (activeFileId === fileId) {
            setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].file_id : null);
        }
    };

    const handleEditorChange = (val: string) => {
        if (activeFileId) {
            setFileContents(prev => ({ ...prev, [activeFileId]: val }));
            if (activeFileId === previewFileId) setPreviewFileId(null);
        }
    };

    const handleSave = async () => {
        if (!activeFile || !activeFileId) return;
        const contentToSave = fileContents[activeFileId];
        try {
            await fileService.updateFile(activeFileId, { content: contentToSave });
            const updatedFileInState = { ...activeFile, content: contentToSave };
            setFiles(prev => prev.map(f => f.file_id === activeFileId ? updatedFileInState : f));
            setOpenFiles(prev => prev.map(f => f.file_id === activeFileId ? updatedFileInState : f));
        } catch (err) {
            alert("Failed to save file.");
        }
    };

    const initiateDelete = () => {
        if (activeFile) setFileToDelete(activeFile);
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            await fileService.deleteFile(fileToDelete.file_id);
            setFiles(prev => prev.filter(f => f.file_id !== fileToDelete.file_id));
            setOpenFiles(prev => prev.filter(f => f.file_id !== fileToDelete.file_id));
            if (previewFileId === fileToDelete.file_id) setPreviewFileId(null);
            if (activeFileId === fileToDelete.file_id) setActiveFileId(null);
            setFileToDelete(null);
        } catch (err) {
            alert("Failed to delete file");
            setFileToDelete(null);
        }
    };

    const initiateCreateFile = () => {
        setNewFileName("");
        setIsCreateModalOpen(true);
    };

    const confirmCreateFile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        let filename = newFileName.trim();
        if (!filename || !notebookId) return;

        if (!filename.includes('.')) {
            filename = `${filename}.md`;
        }

        try {
            const emptyFile = new File([""], filename, { type: "text/plain" });
            const response = await fileService.uploadFile(emptyFile, notebookId, false, false, currentFolderId);
            setIsCreateModalOpen(false);
            setNewFileName("");

            const newFile: FileData = {
                file_id: response.file_id,
                filename: response.filename,
                url: response.url,
                processing_status: 'COMPLETED',
                unique_filename: '',
                content_type: 'text/plain',
                file_size: '0',
                content: '',
                thread_id: null,
                run_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                processing_result: null,
                folder_id: currentFolderId // Explicitly set folder_id
            };
            setFiles(prev => [newFile, ...prev]);
            setFileContents(prev => ({ ...prev, [newFile.file_id]: '' }));
            setOpenFiles(prev => [...prev, newFile]);
            setActiveFileId(newFile.file_id);
            setPreviewFileId(null);

            if (filename.endsWith('.md')) setViewMode('split'); else setViewMode('edit');
        } catch (err) {
            alert("Failed to create file");
        }
    };

    const handleDownload = () => {
        if (activeFile) window.open(activeFile.url, '_blank');
    };

    // --- RECORDING ---
    const startRecording = useCallback(async () => {
        if (!activeFileId) {
            alert("Please open or create a document first to add voice notes.");
            return;
        }
        const aFile = openFiles.find(f => f.file_id === activeFileId);
        if (!aFile || !aFile.content_type?.startsWith('text/')) {
            alert("Voice notes can only be added to text documents.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `voice-note-${timestamp}.webm`;
                const file = new File([audioBlob], filename, { type: 'audio/webm' });
                handleVoiceUpload(file, activeFileId);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("Could not access microphone. Please check your permissions.");
        }
    }, [activeFileId, openFiles, handleVoiceUpload]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // --- SSE ---
    useEffect(() => {
        if (!notebookId) return;
        const channelId = `sse:notebook_files:${notebookId}`;
        const sseUrl = `${API_CONFIG.URL}/sse/${encodeURIComponent(channelId)}`;
        const eventSource = new EventSource(sseUrl, { withCredentials: true });

        console.log("Connecting to SSE:", sseUrl);

        eventSource.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                if (parsedData.event === "file_update") {
                    const updateData = parsedData.data;

                    // --- SIMPLIFIED HANDLER: TRUST BACKEND CONTENT ---

                    // 1. Update Content Map (Editor) if the file is loaded
                    setFileContents(prevContents => {
                        if (prevContents[updateData.file_id] !== undefined && updateData.content) {
                            return { ...prevContents, [updateData.file_id]: updateData.content };
                        }
                        return prevContents;
                    });

                    // 2. Update File List
                    setFiles(prevFiles => prevFiles.map(f => {
                        if (f.file_id === updateData.file_id) {
                            return {
                                ...f,
                                processing_status: updateData.status,
                                filename: updateData.filename,
                                content: updateData.content || f.content,
                                content_type: updateData.content_type || f.content_type,
                                folder_id: f.folder_id // Ensure folder_id is preserved
                            };
                        }
                        return f;
                    }));

                    // 3. Clear loading spinner for transcription
                    if (updateData.file_id === transcribingFileId) {
                        setTranscribingFileId(null);
                    }
                    else if (updateData.status === 'FAILED' && updateData.file_id === transcribingFileId) {
                        setTranscribingFileId(null);
                        alert("Transcription failed.");
                    }
                }
            } catch (e) {
                console.error("Error parsing SSE event", e);
            }
        };
        // Removed fileContents from dependency array to prevent reconnection loops
        return () => eventSource.close();
    }, [notebookId, transcribingFileId]);

    // --- SIDEBAR RESIZING ---
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

    return {
        // Data
        files,
        loading,
        fetchFiles,
        // Tabs & Selection
        openFiles,
        activeFileId,
        setActiveFileId,
        previewFileId,
        activeFile,
        fileContents,
        isFileDirty,
        // UI
        viewMode,
        setViewMode,
        sidebarWidth,
        isSidebarVisible,
        setIsSidebarVisible,
        startResizing,
        // Modals
        isCreateModalOpen,
        setIsCreateModalOpen,
        newFileName,
        setNewFileName,
        fileToDelete,
        setFileToDelete,
        // Recording
        isRecording,
        transcribingFileId,
        // Actions
        handleOpenFile,
        handlePinFile,
        handleDoubleClickFile,
        handleCloseTab,
        handleEditorChange,
        handleSave,
        handleDownload,
        onUploadInputChange,
        initiateDelete,
        confirmDelete,
        initiateCreateFile,
        confirmCreateFile,
        startRecording,
        stopRecording,
        // Folders
        folders,
        currentFolderId,
        setCurrentFolderId,
        createFolder,
        moveFile
    };
};