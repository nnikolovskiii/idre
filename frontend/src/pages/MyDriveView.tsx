import {useState, useEffect, useCallback} from "react";
import {useParams} from "react-router-dom";
import {fileService, type FileData} from "../services/filesService";
import InputArea from "../components/chat/InputArea";
import Layout from "../components/layout/Layout";
import {useChats} from "../hooks/useChats.ts";
import {useAuth} from "../contexts/AuthContext";
import {
    DriveError,
    DriveFileList,
    DriveHeader,
    DriveLoading,
    FileViewerModal,
    TranscriptionModal
} from "../components/drive";

// --- START: Delete Confirmation Modal (no changes here) ---
interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    fileName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({isOpen, onClose, onConfirm, fileName}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-background rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
                <h2 className="text-lg font-semibold text-foreground">Confirm Deletion</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Are you sure you want to delete the file: <br/>
                    <strong className="text-foreground">{fileName}</strong>?
                </p>
                <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- END: Delete Confirmation Modal ---

const MyDriveView = () => {
    const {notebookId} = useParams<{ notebookId: string }>();

    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fileViewerOpen, setFileViewerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
    const [transcriptionOpen, setTranscriptionOpen] = useState(false);
    const [selectedTranscription, setSelectedTranscription] = useState('');
    const [selectedFilename, setSelectedFilename] = useState('');
    const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

    const [editorContent, setEditorContent] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);

    const {
        chatSessions,
        currentChatId,
        loadingChats,
        creatingChat,
        isTyping,
        createNewChat,
        switchToChat,
        handleDeleteChat
    } = useChats(notebookId);
    const {isAuthenticated, user} = useAuth();

    const fetchFiles = useCallback(async () => {
        if (!notebookId) {
            setError("No notebook ID provided");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const fileData = await fileService.getUserFiles(notebookId);
            setFiles(fileData.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [notebookId]);

    useEffect(() => {
        fetchFiles();
    }, [notebookId, fetchFiles]);

    useEffect(() => {
        if (selectedFile && !files.find(f => f.file_id === selectedFile.file_id)) {
            setSelectedFile(null);
            setEditorContent('');
            setIsDirty(false);
        }
    }, [files, selectedFile]);

    const handleDeleteRequest = (file: FileData) => setFileToDelete(file);

    const confirmDelete = useCallback(async () => {
        if (!fileToDelete) return;
        try {
            await fileService.deleteFile(fileToDelete.file_id);
            await fetchFiles();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete file");
        } finally {
            setFileToDelete(null);
        }
    }, [fileToDelete, fetchFiles]);

    const handleEdit = useCallback(async (file: FileData, newFilename: string) => {
        try {
            await fileService.updateFile(file.file_id, {filename: newFilename});
            await fetchFiles();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update file name");
        }
    }, [fetchFiles]);

    const handleViewTranscription = useCallback((file: FileData) => {
        setSelectedTranscription(file.processing_result?.transcription || '');
        setSelectedFilename(file.filename);
        setTranscriptionOpen(true);
    }, []);

    const handleFileClick = (item: FileData) => {
        if (isDirty && !window.confirm("You have unsaved changes that will be lost. Are you sure?")) {
            return;
        }
        if (item.file_id === selectedFile?.file_id) return;
        

        setSelectedFile(item);
        setEditorContent(item.content || '');
        setIsDirty(false);
        setFileViewerOpen(false);

    };

    const closeFileViewer = () => {
        setFileViewerOpen(false);
        setSelectedFile(null);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setEditorContent(newContent);
        if (selectedFile) {
            const sourceText = selectedFile.content;
            setIsDirty(newContent !== (sourceText || ''));
        }
    };

    // UPDATED: This function now ALWAYS saves to the 'content' field.
    const handleSaveContent = useCallback(async () => {
        if (!selectedFile || !isDirty) return;

        try {
            // Always update the 'content' field, regardless of file type.
            await fileService.updateFile(selectedFile.file_id, {content: editorContent});

            // Create a copy of the updated file for immediate UI feedback.
            const updatedFile = {...selectedFile, content: editorContent};

            // If it was an audio file, we also update its transcription property
            // in the local state so the UI stays consistent until the next refresh.
            if (selectedFile.content_type.startsWith('audio/')) {
                updatedFile.processing_result = {
                    ...selectedFile.processing_result,
                    transcription: editorContent,
                };
            }

            // Update the local state for a responsive feel.
            setSelectedFile(updatedFile);
            setFiles(files.map(f => f.file_id === selectedFile.file_id ? updatedFile : f));
            setIsDirty(false);

            // Refresh the full data from the server in the background.
            await fetchFiles();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to save content");
        }
    }, [selectedFile, editorContent, isDirty, files, fetchFiles]);


    const handleCloseEditor = () => {
        if (isDirty && !window.confirm("You have unsaved changes that will be lost. Are you sure?")) {
            return;
        }
        setSelectedFile(null);
        setEditorContent('');
        setIsDirty(false);
    };

    const uploadAndRefresh = async (file: File) => {
        if (!notebookId) return;
        try {
            await fileService.uploadFile(file, notebookId);
            await fetchFiles();
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    const handleTextSubmit = async (text: string) => {
        const file = new File([text], `message-${Date.now()}.txt`, {type: "text/plain"});
        await uploadAndRefresh(file);
    };

    const handleAudioSubmit = async (text: string, blob: Blob) => {
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {type: "audio/webm"});
        await uploadAndRefresh(audioFile);
        if (text.trim()) await handleTextSubmit(text);
    };

    const handleFileSubmit = async (file: File) => await uploadAndRefresh(file);

    if (!notebookId) {
        return (
            <div className="flex h-screen relative">
                <main className="flex-1 overflow-hidden flex flex-col">
                    <div
                        className="font-sans bg-white text-gray-800 p-4 border border-gray-200 box-border flex-1 overflow-auto">
                        <DriveError
                            error="No notebook ID provided in URL"
                            onRetry={() => window.history.back()}
                        />
                    </div>
                </main>
            </div>
        );
    }

    const isEditorOpen = selectedFile && (
        selectedFile.content_type.startsWith('text/') ||
        (selectedFile.content_type.startsWith('audio/') && selectedFile.processing_status === 'completed')
    );

    const children = (
        <div className="flex flex-1 overflow-hidden h-full">
            <div className="w-full md:w-2/5 border-r border-border overflow-y-auto">
                <div className="p-3 md:p-6">
                    <DriveHeader/>
                    {loading && <DriveLoading/>}
                    {error && <DriveError error={error} onRetry={fetchFiles}/>}
                    {!loading && !error && (
                        <DriveFileList items={files} onFileClick={handleFileClick}
                                       onViewTranscription={handleViewTranscription} onDelete={handleDeleteRequest}
                                       onEdit={handleEdit}/>
                    )}
                </div>
            </div>
            <div className="hidden md:flex flex-col w-3/5 bgF-background">
                {isEditorOpen && selectedFile ? (
                    <>
                        <div className="p-3 border-b border-border flex justify-between items-center flex-shrink-0">
                            <h3 className="font-semibold text-foreground truncate"
                                title={selectedFile.filename}>{selectedFile.filename}</h3>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleSaveContent} disabled={!isDirty}
                                        className="px-3 py-1 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Save
                                </button>
                                <button onClick={handleCloseEditor}
                                        className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                        title="Close editor">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                         strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            <textarea value={editorContent} onChange={handleContentChange}
                                      className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none focus:outline-none font-mono text-sm"
                                      placeholder="File content..."/>
                        </div>
                    </>
                ) : (
                    <div className="flex justify-center items-center h-full text-muted-foreground">
                        <p className="text-center px-4">
                            Select a text file or an audio file with a<br/>transcription to edit its content.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const inputArea = (
        <div className="p-3 md:p-4 bg-background">
            <InputArea onTextSubmit={handleTextSubmit} onAudioSubmit={handleAudioSubmit} onFileSubmit={handleFileSubmit}
                       onModelsRequired={() => {
                       }} hasModelsConfigured={true}/>
        </div>
    );

    return (
        <>
            <Layout notebookId={notebookId} title="My Drive" chatSessions={chatSessions} currentChatId={currentChatId}
                    loadingChats={loadingChats} creatingChat={creatingChat} isTyping={isTyping}
                    isAuthenticated={isAuthenticated} user={user} createNewChat={createNewChat}
                    switchToChat={switchToChat} handleDeleteChat={handleDeleteChat} children={children}
                    inputArea={inputArea}/>
            {selectedFile &&
                <FileViewerModal isOpen={fileViewerOpen} onClose={closeFileViewer} fileName={selectedFile.filename}
                                 fileId={selectedFile.file_id} fileUrl={selectedFile.url}
                                 contentType={selectedFile.content_type}/>}
            {transcriptionOpen &&
                <TranscriptionModal isOpen={transcriptionOpen} onClose={() => setTranscriptionOpen(false)}
                                    transcription={selectedTranscription} filename={selectedFilename}/>}
            {fileToDelete && <DeleteConfirmationModal isOpen={!!fileToDelete} onClose={() => setFileToDelete(null)}
                                                      onConfirm={confirmDelete} fileName={fileToDelete.filename}/>}
        </>
    );
};

export default MyDriveView;