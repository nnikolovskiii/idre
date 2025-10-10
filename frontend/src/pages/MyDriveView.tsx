// Updated src/views/MyDriveView.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  MdArrowDropDown,
  MdArrowUpward,
  MdInsertDriveFile,
  MdImage,
  MdAudiotrack,
  MdPictureAsPdf,
  MdCode,
  MdDescription,
  MdVideocam,
} from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { fileService } from "../lib/filesService";
import type { FileData } from "../lib/filesService";
import InputArea from "../components/chat/InputArea";
import Layout from "../components/layout/Layout"; // Adjust path as needed
import "./MyDriveView.css";
import {useChats} from "../hooks/useChats.ts";

// File Viewer Modal Component (kept as is)
const FileViewerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  contentType: string;
}> = ({ isOpen, onClose, fileName, fileUrl, contentType }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contentType.startsWith("text/")) {
      fetchFileContent();
    }
  }, [isOpen, contentType]);

  const fetchFileContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      const text = await response.text();
      setFileContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isImage = contentType.startsWith("image/");
  const isText = contentType.startsWith("text/");
  const isAudio = contentType.startsWith("audio/");

  return (
      <div className="file-viewer-modal-overlay" onClick={onClose}>
        <div className="file-viewer-modal" onClick={(e) => e.stopPropagation()}>
          <div className="file-viewer-header">
            <h3>{fileName}</h3>
            <button className="file-viewer-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="file-viewer-content">
            {loading && (
                <div className="file-viewer-loading">
                  <div className="loading-spinner"></div>
                  <span>Loading file...</span>
                </div>
            )}
            {error && (
                <div className="file-viewer-error">
                  <p>Error: {error}</p>
                  <button onClick={fetchFileContent}>Retry</button>
                </div>
            )}
            {isImage && !loading && (
                <img
                    src={fileUrl}
                    alt={fileName}
                    className="file-viewer-image"
                    onError={() => setError("Failed to load image")}
                />
            )}
            {isAudio && !loading && !error && (
                <div className="file-viewer-audio">
                  <audio
                      controls
                      preload="metadata"
                      className="audio-player"
                      onError={() => setError("Failed to load audio")}
                  >
                    <source src={fileUrl} type={contentType} />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="audio-info">
                    <p>
                      <strong>File:</strong> {fileName}
                    </p>
                    <p>
                      <strong>Type:</strong> {contentType}
                    </p>
                  </div>
                </div>
            )}
            {isText && !loading && !error && (
                <pre className="file-viewer-text">{fileContent}</pre>
            )}
            {!isImage && !isAudio && !isText && !loading && !error && (
                <div className="file-viewer-unsupported">
                  <p>This file type cannot be previewed in the application.</p>
                  <button
                      onClick={() => window.open(fileUrl, "_blank")}
                      className="file-viewer-download-btn"
                  >
                    Open in New Tab
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

// Transcription Modal Component
const TranscriptionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transcription: string;
  filename: string;
}> = ({ isOpen, onClose, transcription, filename }) => {
  if (!isOpen) return null;

  return (
      <div className="transcription-modal-overlay" onClick={onClose}>
        <div className="transcription-modal" onClick={(e) => e.stopPropagation()}>
          <div className="transcription-header">
            <h3>Transcription for {filename}</h3>
            <button className="transcription-close" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="transcription-content">
            <pre className="transcription-text">{transcription}</pre>
          </div>
        </div>
      </div>
  );
};

// DriveHeader Component
const DriveHeader: React.FC<{ notebookId: string }> = ({ notebookId }) => {
  return (
      <header className="drive-header">
        <div className="drive-title-container">
          <h1 className="drive-title">My Drive</h1>
        </div>
        <div className="drive-header-icons">
          {/* Commented out view toggles */}
        </div>
      </header>
  );
};

// DriveFileItem Component
const DriveFileItem: React.FC<{
  item: FileData;
  onFileClick: (item: FileData) => void;
  onViewTranscription?: (item: FileData) => void;
}> = ({ item, onFileClick, onViewTranscription }) => {
  const handleClick = () => {
    onFileClick(item);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  let icon: React.ElementType = MdInsertDriveFile;
  let iconColor: string = "#1967d2";

  const contentType = item.content_type;
  const extension = item.filename.split(".").pop()?.toLowerCase();

  if (contentType?.startsWith("image/")) {
    icon = MdImage;
    iconColor = "#1a73e8";
  } else if (contentType?.startsWith("audio/")) {
    icon = MdAudiotrack;
    iconColor = "#34a853";
  } else if (contentType?.startsWith("video/")) {
    icon = MdVideocam;
    iconColor = "#ea4335";
  } else if (contentType === "application/pdf") {
    icon = MdPictureAsPdf;
    iconColor = "#db4437";
  } else if (contentType?.startsWith("text/") ||
      extension === "js" ||
      extension === "ts" ||
      extension === "py" ||
      extension === "html" ||
      extension === "css" ||
      extension === "json" ||
      extension === "txt") {
    icon = MdCode;
    iconColor = "#4285f4";
  } else if (extension === "doc" || extension === "docx" || extension === "xls" || extension === "xlsx") {
    icon = MdDescription;
    iconColor = "#fbbc04";
  } else {
    icon = MdInsertDriveFile;
    iconColor = "#1967d2";
  }

  const dateModified = formatDate(item.updated_at || item.created_at);
  const fileSize = item.file_size || "—";

  let transcriptionContent: React.ReactNode = "—";
  const status = item.processing_status;
  const isAudio = contentType?.startsWith("audio/") || false;

  if (isAudio) {
    if (status === "pending") {
      transcriptionContent = "No transcription";
    } else if (status === "processing") {
      transcriptionContent = (
          <div className="transcription-loading">
            <div className="loading-spinner-small"></div>
          </div>
      );
    } else if (status === "completed" && item.processing_result?.transcription) {
      transcriptionContent = (
          <button
              className="view-transcription-btn"
              onClick={(e) => {
                e.stopPropagation();
                onViewTranscription?.(item);
              }}
          >
            View Transcription
          </button>
      );
    } else if (status === "failed") {
      transcriptionContent = "Failed";
    }
  }

  return (
      <div className="drive-list-item clickable" onClick={handleClick}>
        <div className="grid-cell name-cell">
          {React.createElement(icon, {
            size: 24,
            style: {
              marginRight: 16,
              color: iconColor,
              flexShrink: 0,
            }
          })}
          <span>{item.filename}</span>
        </div>
        <div className="grid-cell date-cell">{dateModified}</div>
        <div className="grid-cell size-cell">{fileSize}</div>
        <div className="grid-cell transcription-cell">{transcriptionContent}</div>
        <div className="grid-cell more-cell">
          <BsThreeDotsVertical size={18} />
        </div>
      </div>
  );
};

// DriveFileList Component
const DriveFileList: React.FC<{
  items: FileData[];
  onFileClick: (item: FileData) => void;
  onViewTranscription?: (item: FileData) => void;
}> = ({ items, onFileClick, onViewTranscription }) => {
  return (
      <div className="drive-file-list">
        <div className="drive-list-header">
          <div className="grid-cell name-header">
            Name <MdArrowUpward size={16} style={{ marginLeft: 4 }} />
          </div>
          <div className="grid-cell date-header">Date modified</div>
          <div className="grid-cell size-header">File size</div>
          <div className="grid-cell transcription-header">Transcription</div>
        </div>

        {items.map((item) => (
            <DriveFileItem
                key={item.file_id}
                item={item}
                onFileClick={onFileClick}
                onViewTranscription={onViewTranscription}
            />
        ))}
      </div>
  );
};

// Loading Component
const DriveLoading: React.FC = () => (
    <div className="drive-loading">
      <div className="loading-spinner"></div>
      <span>Loading files...</span>
    </div>
);

// Error Component
const DriveError: React.FC<{ error: string; onRetry: () => void }> = ({
                                                                        error,
                                                                        onRetry,
                                                                      }) => (
    <div className="drive-error">
      <div className="error-message">{error}</div>
      <button className="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
);

const MyDriveView = () => {
  const { notebookId } = useParams<{ notebookId: string }>();

  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<string>('');
  const [selectedFilename, setSelectedFilename] = useState<string>('');

  const {
    currentChatId,
    creatingChat,
    isTyping,
  } = useChats(notebookId); // Only pull needed for InputArea

  const fetchFiles = async () => {
    if (!notebookId) {
      setError("No notebook ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fileData = await fileService.getUserFiles(notebookId);
      console.log(fileData.data);
      setFiles(fileData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [notebookId]);

  const handleViewTranscription = useCallback((file: FileData) => {
    setSelectedTranscription(file.processing_result?.transcription || '');
    setSelectedFilename(file.filename);
    setTranscriptionOpen(true);
  }, []);

  const handleTextSubmit = async (text: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `message-${timestamp}.txt`;
    const fileContent = new File([text], filename, { type: "text/plain" });

    const uploadResult = await fileService.uploadFile(fileContent, notebookId);

    console.log("File uploaded successfully:", uploadResult);

    await fetchFiles();

    console.log("Message saved as file:", { text, filename, uploadResult, notebookId });
  };

  const handleAudioSubmit = async (text: string, blob: Blob) => {
    try {
      // Upload audio blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const baseFilename = `recording-${timestamp}`;
      const uniqueTimestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueFilename = `${baseFilename}_${uniqueTimestamp}_${randomString}.webm`;
      const audioFile = new File([blob], uniqueFilename, { type: "audio/webm" });

      await fileService.uploadFile(audioFile, notebookId);

      // If text is provided, upload it as a separate file
      if (text.trim()) {
        const textTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const textFilename = `message-${textTimestamp}.txt`;
        const textFile = new File([text], textFilename, { type: "text/plain" });
        await fileService.uploadFile(textFile, notebookId);
      }

      await fetchFiles();
      console.log("Audio processed:", { text: text.trim() ? "included" : "none", uniqueFilename, notebookId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to process audio:", err);

      // Upload error as file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `audio-error-${timestamp}.txt`;
      const errorFile = new File([`[Error] Failed to process audio: ${errorMessage}`], filename, { type: "text/plain" });
      await fileService.uploadFile(errorFile, notebookId);
      await fetchFiles();
    }
  };

  const handleFileSubmit = async (file: File) => {
    try {
      await fileService.uploadFile(file, notebookId);

      console.log("File uploaded successfully:", { file: file.name });

      await fetchFiles();
    } catch (err) {
      console.error("Failed to upload file:", err);
      const errorMessage = `[Error] Failed to upload file: ${file.name}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `file-error-${timestamp}.txt`;
      const errFile = new File([errorMessage], filename, { type: "text/plain" });
      await fileService.uploadFile(errFile, notebookId);
      await fetchFiles();
    }
  };

  const handleModelsRequired = () => {
    // Handled in Layout via onSettingsClick
  };

  const handleFileClick = (item: FileData) => {
    setSelectedFile(item);
    setFileViewerOpen(true);
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
  };

  if (!notebookId) {
    return (
        <div className="drive-view-wrapper">
          <main className="main-drive-area">
            <div className="drive-container">
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
      <div className="drive-container">
        <DriveHeader notebookId={notebookId} />
        {loading && <DriveLoading />}
        {error && <DriveError error={error} onRetry={fetchFiles} />}
        {!loading && !error && (
            <DriveFileList
                items={files}
                onFileClick={handleFileClick}
                onViewTranscription={handleViewTranscription}
            />
        )}
      </div>
  );

  const inputArea = (
      <div className="drive-input-area">
        <InputArea
            onTextSubmit={handleTextSubmit}
            onAudioSubmit={handleAudioSubmit}
            onFileSubmit={handleFileSubmit}
            onModelsRequired={handleModelsRequired}
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
            wrapperClassName="drive-view-wrapper"
            mainClassName="main-drive-area"
        />
        {/* File Viewer Modal - kept outside Layout as it's specific */}
        {selectedFile && (
            <FileViewerModal
                isOpen={fileViewerOpen}
                onClose={closeFileViewer}
                fileName={selectedFile.filename}
                fileUrl={selectedFile.url}
                contentType={selectedFile.content_type}
            />
        )}
        {/* Transcription Modal */}
        {transcriptionOpen && selectedTranscription && (
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