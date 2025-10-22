import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fileService, type FileData } from "../lib/filesService";
import InputArea from "../components/chat/InputArea";
import Layout from "../components/layout/Layout";
import { useChats } from "../hooks/useChats.ts";
import { useAuth } from "../contexts/AuthContext";
import {
  DriveError,
  DriveFileList,
  DriveHeader,
  DriveLoading,
  FileViewerModal,
  TranscriptionModal
} from "../components/drive";

// --- START: Added for the custom delete modal ---
// You can move this component to its own file (e.g., components/drive/DeleteConfirmationModal.tsx)
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
                                                                           isOpen,
                                                                           onClose,
                                                                           onConfirm,
                                                                           fileName,
                                                                         }) => {
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-background rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold text-foreground">Confirm Deletion</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete the file: <br />
            <strong className="text-foreground">{fileName}</strong>?
          </p>
          <p className="mt-2 text-sm text-red-500">This action cannot be undone.</p>
          <div className="mt-6 flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
  );
};
// --- END: Added for the custom delete modal ---


const MyDriveView = () => {
  const { notebookId } = useParams<{ notebookId: string }>();

  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState('');
  const [selectedFilename, setSelectedFilename] = useState('');

  // 1. Add state to track the file targeted for deletion
  const [fileToDelete, setFileToDelete] = useState<FileData | null>(null);

  const {
    chatSessions,
    currentChatId,
    loadingChats,
    creatingChat,
    isTyping,
    createNewChat,
    switchToChat,
    handleDeleteChat,
  } = useChats(notebookId);

  const { isAuthenticated, user } = useAuth();

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


  // 2. Replace the old handleDelete with two new functions

  // This function OPENS the modal by setting the state
  const handleDeleteRequest = (file: FileData) => {
    setFileToDelete(file);
  };

  // This function PERFORMS the delete and closes the modal
  const confirmDelete = useCallback(async () => {
    if (!fileToDelete) return; // Safety check

    try {
      await fileService.deleteFile(fileToDelete.file_id);
      await fetchFiles(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete file";
      alert(errorMessage);
    } finally {
      setFileToDelete(null); // Close the modal
    }
  }, [fileToDelete, fetchFiles]);


  const handleViewTranscription = useCallback((file: FileData) => {
    setSelectedTranscription(file.processing_result?.transcription || '');
    setSelectedFilename(file.filename);
    setTranscriptionOpen(true);
  }, []);

  const handleFileClick = (item: FileData) => {
    setSelectedFile(item);
    setFileViewerOpen(true);
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
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
    const file = new File([text], `message-${Date.now()}.txt`, { type: "text/plain" });
    await uploadAndRefresh(file);
  };

  const handleAudioSubmit = async (text: string, blob: Blob) => {
    const audioFile = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
    await uploadAndRefresh(audioFile);
    if (text.trim()) {
      await handleTextSubmit(text);
    }
  };

  const handleFileSubmit = async (file: File) => {
    await uploadAndRefresh(file);
  };


  if (!notebookId) {
    return (
        <div className="flex h-screen relative">
          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="font-sans bg-white text-gray-800 p-4 border border-gray-200 box-border flex-1 overflow-auto">
              <DriveError
                  error="No notebook ID provided in URL"
                  onRetry={() => window.history.back()}
              />
            </div>
          </main>
        </div>
    );
  }

  const children = (
      <div className="font-sans p-3 md:p-6 rounded-lg max-w-full box-border flex-1 overflow-auto">
        <DriveHeader/>
        {loading && <DriveLoading />}
        {error && <DriveError error={error} onRetry={fetchFiles} />}
        {!loading && !error && (
            <DriveFileList
                items={files}
                onFileClick={handleFileClick}
                onViewTranscription={handleViewTranscription}
                // 3. Pass the new function to the component
                onDelete={handleDeleteRequest}
            />
        )}
      </div>
  );

  const inputArea = (
      <div className="p-3 md:p-4 bg-background">
        <InputArea
            onTextSubmit={handleTextSubmit}
            onAudioSubmit={handleAudioSubmit}
            onFileSubmit={handleFileSubmit}
            onModelsRequired={() => {}}
            hasModelsConfigured={true}
            // disabled={!currentChatId || creatingChat || isTyping}
        />
      </div>
  );

  return (
      <>
        <Layout
            notebookId={notebookId}
            title="My Drive"
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
            children={children}
            inputArea={inputArea}
        />
        {selectedFile && (
            <FileViewerModal
                isOpen={fileViewerOpen}
                onClose={closeFileViewer}
                fileName={selectedFile.filename}
                fileUrl={selectedFile.url}
                contentType={selectedFile.content_type}
            />
        )}
        {transcriptionOpen && (
            <TranscriptionModal
                isOpen={transcriptionOpen}
                onClose={() => setTranscriptionOpen(false)}
                transcription={selectedTranscription}
                filename={selectedFilename}
            />
        )}

        {/* 4. Render the new Delete Confirmation Modal */}
        {fileToDelete && (
            <DeleteConfirmationModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={confirmDelete}
                fileName={fileToDelete.filename}
            />
        )}
      </>
  );
};

export default MyDriveView;