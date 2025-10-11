import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fileService, type FileData } from "../lib/filesService";
import InputArea from "../components/chat/InputArea";
import Layout from "../components/layout/Layout";
import { useChats } from "../hooks/useChats.ts";
import {
  DriveError,
  DriveFileList,
  DriveHeader,
  DriveLoading,
  FileViewerModal,
  TranscriptionModal
} from "../components/drive";

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

  const {
    currentChatId,
    creatingChat,
    isTyping,
  } = useChats(notebookId);

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

  const handleDelete = useCallback(async (file: FileData) => {
    if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }
    try {
      await fileService.deleteFile(file.file_id);
      await fetchFiles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete file";
      alert(errorMessage);
    }
  }, [fetchFiles]);

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
      // Handle upload error feedback to the user if needed
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
      <div className="font-sans bg-white text-gray-800 p-2 md:p-4 rounded-lg max-w-full border border-gray-200 box-border flex-1 overflow-auto">
        <DriveHeader notebookId={notebookId} />
        {loading && <DriveLoading />}
        {error && <DriveError error={error} onRetry={fetchFiles} />}
        {!loading && !error && (
            <DriveFileList
                items={files}
                onFileClick={handleFileClick}
                onViewTranscription={handleViewTranscription}
                onDelete={handleDelete}
            />
        )}
      </div>
  );

  const inputArea = (
      <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0 z-10">
        <InputArea
            onTextSubmit={handleTextSubmit}
            onAudioSubmit={handleAudioSubmit}
            onFileSubmit={handleFileSubmit}
            onModelsRequired={() => {}}
            hasModelsConfigured={true}
            disabled={!currentChatId || creatingChat || isTyping}
        />
      </div>
  );

  return (
      <>
        <Layout
            notebookId={notebookId}
            children={children}
            inputArea={inputArea}
            wrapperClassName="flex h-screen relative"
            mainClassName="flex-1 overflow-hidden flex flex-col"
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
      </>
  );
};

export default MyDriveView;