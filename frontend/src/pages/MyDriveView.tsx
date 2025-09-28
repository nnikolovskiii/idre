import React, { useState, useEffect } from "react";
import {
  MdArrowDropDown,
  MdArrowUpward,
  MdInfoOutline,
  MdInsertDriveFile,
} from "react-icons/md";
import { BsGrid3X3, BsThreeDotsVertical } from "react-icons/bs";
import { FaList } from "react-icons/fa";
import { BiSort } from "react-icons/bi";
import { fileService } from "../lib/filesService";
import type { FileData } from "../lib/filesService";
import { useAuth } from "../contexts/AuthContext";
import { useChats } from "../hooks/useChats";
import { useModals } from "../hooks/useModals";
import ChatSidebar from "../components/chat/ChatSidebar";
import InputArea from "../components/chat/InputArea";
import ModelSettingsModal from "../components/modals/ModelSettingsModal";
import LoginModal from "../components/modals/LoginModal";
import RegisterModal from "../components/modals/RegisterModal";
import "./MyDriveView.css";

// File Viewer Modal Component
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

// 1. DATA DEFINITION
// Type for a single drive item
type DriveItem = {
  id: number;
  name: string;
  dateModified: string;
  fileSize: string | null;
  icon: React.ElementType;
  iconColor: string;
};

// 2. SUB-COMPONENTS

// DriveHeader Component
const DriveHeader: React.FC = () => {
  return (
    <header className="drive-header">
      <div className="drive-title-container">
        <h1 className="drive-title">My Drive</h1>
        <MdArrowDropDown
          size={24}
          style={{ color: "#5f6368", cursor: "pointer" }}
        />
      </div>
      <div className="drive-header-icons">
        <button
          className="drive-icon-button drive-icon-button-selected"
          aria-label="List view"
        >
          <FaList size={18} />
        </button>
        <button className="drive-icon-button" aria-label="Grid view">
          <BsGrid3X3 size={18} />
        </button>
        <button className="drive-icon-button" aria-label="View details">
          <MdInfoOutline size={22} />
        </button>
      </div>
    </header>
  );
};

// DriveFilterBar Component
const DriveFilterBar: React.FC = () => {
  return (
    <div className="drive-filter-bar">
      <button className="drive-filter-button">
        Type <MdArrowDropDown />
      </button>
      <button className="drive-filter-button">
        People <MdArrowDropDown />
      </button>
      <button className="drive-filter-button">
        Modified <MdArrowDropDown />
      </button>
      <button className="drive-filter-button">
        Source <MdArrowDropDown />
      </button>
    </div>
  );
};

// DriveFileItem Component
const DriveFileItem: React.FC<{
  item: DriveItem;
  onFileClick: (item: DriveItem) => void;
}> = ({ item, onFileClick }) => {
  const handleClick = () => {
    onFileClick(item);
  };

  return (
    <div className="drive-list-item clickable" onClick={handleClick}>
      <div className="grid-cell name-cell">
        <item.icon
          size={24}
          style={{
            marginRight: 16,
            color: item.iconColor,
            flexShrink: 0,
          }}
        />
        <span>{item.name}</span>
      </div>
      <div className="grid-cell date-cell">{item.dateModified}</div>
      <div className="grid-cell size-cell">{item.fileSize}</div>
      <div className="grid-cell more-cell">
        <BsThreeDotsVertical size={18} />
      </div>
    </div>
  );
};

// DriveFileList Component
const DriveFileList: React.FC<{
  items: DriveItem[];
  onFileClick: (item: DriveItem) => void;
}> = ({ items, onFileClick }) => {
  return (
    <div className="drive-file-list">
      <div className="drive-list-header">
        <div className="grid-cell name-header">
          Name <MdArrowUpward size={16} style={{ marginLeft: 4 }} />
        </div>
        <div className="grid-cell date-header">Date modified</div>
        <div className="grid-cell size-header">File size</div>
        <div className="grid-cell sort-header">
          <BiSort size={18} />
          <span>Sort</span>
        </div>
      </div>

      {items.map((item) => (
        <DriveFileItem key={item.id} item={item} onFileClick={onFileClick} />
      ))}
    </div>
  );
};

// Helper function to convert FileData to DriveItem
const convertFileToDriveItem = (file: FileData): DriveItem => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return {
    id: parseInt(file.file_id.slice(-6), 16), // Convert last 6 chars of UUID to number for display
    name: file.filename,
    dateModified: formatDate(file.created_at),
    fileSize: file.file_size || "—", // Use the actual file size from backend
    icon: MdInsertDriveFile,
    iconColor: "#1967d2", // Blue color for files
  };
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

// 3. MAIN COMPONENT
const MyDriveView = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const { logout } = useAuth();
  const {
    chatSessions,
    currentChatId,
    loadingChats,
    creatingChat,
    isAuthenticated,
    user,
    createNewChat,
    switchToChat,
    handleDeleteChat,
  } = useChats();

  const {
    modals,
    actions: {
      handleOpenAIModelsSettings,
      handleCloseAIModelsSettings,
      handleCloseDefaultModelsModal,
      handleOpenLoginModal,
      handleCloseLoginModal,
      handleOpenRegisterModal,
      handleCloseRegisterModal,
      switchToRegister,
      switchToLogin,
    },
  } = useModals();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileData = await fileService.getFiles();
      setFiles(fileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        // On desktop, always show sidebar
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const driveItems = files.map(convertFileToDriveItem);

  const handleSendMessage = async (text?: string, audioPath?: string) => {
    // Handle sending messages from the drive view
    if (text) {
      try {
        // Create a .txt file with the text content
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `message-${timestamp}.txt`;
        const file = new File([text], filename, { type: "text/plain" });

        // Upload the file using fileService
        const uploadResult = await fileService.uploadFile(file);

        console.log("File uploaded successfully:", uploadResult);

        // Refresh the files list to show the new uploaded file
        await fetchFiles();

        // If there's no current chat, create one
        if (!currentChatId) {
          createNewChat();
        }

        // TODO: You could also send the uploaded file to a chat or process it further
        console.log("Message saved as file:", { text, filename, uploadResult });
      } catch (error) {
        console.error("Failed to upload message as file:", error);
        // Fallback to just logging if upload fails
        console.log("Message from MyDriveView:", { text, audioPath });
      }
    } else if (audioPath) {
      // Handle audio files - refresh the file list after audio upload
      console.log("Audio message from MyDriveView:", { audioPath });

      // Refresh the files list to show the newly uploaded audio file
      try {
        await fetchFiles();
        console.log("File list refreshed after audio upload");
      } catch (error) {
        console.error("Failed to refresh files after audio upload:", error);
      }
    }
  };

  const handleModelsRequired = () => {
    // Open the model settings modal when models are required
    handleOpenAIModelsSettings();
  };

  const handleFileClick = (item: DriveItem) => {
    // Handle file click - open the file for viewing
    if (item.icon === MdInsertDriveFile) {
      // This is a file from our service, open in modal
      const correspondingFile = files.find((f) => f.filename === item.name);
      if (correspondingFile) {
        setSelectedFile(correspondingFile);
        setFileViewerOpen(true);
      } else {
        console.error("File not found for:", item.name);
      }
    } else {
      // For folders or other items, just log for now
      console.log("Clicked on:", item.name);
    }
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="drive-view-wrapper">
      {isMobile && (
        <div
          className={`mobile-overlay ${isSidebarOpen ? "visible" : ""}`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`chat-sidebar-container ${isMobile ? "mobile" : ""}`}>
        <ChatSidebar
          chatSessions={chatSessions}
          currentChatId={currentChatId}
          collapsed={!isSidebarOpen}
          onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
          onCreateNewChat={createNewChat}
          onSwitchChat={switchToChat}
          onDeleteChat={handleDeleteChat}
          loading={loadingChats}
          creatingChat={creatingChat}
          onSettingsClick={handleOpenAIModelsSettings}
          user={user || undefined}
          onLogout={logout}
          isAuthenticated={isAuthenticated}
          onLoginClick={handleOpenLoginModal}
          onRegisterClick={handleOpenRegisterModal}
        />
      </div>

      <main className="main-drive-area">
        <div className="drive-container">
          <DriveHeader />
          <DriveFilterBar />

          {loading && <DriveLoading />}
          {error && <DriveError error={error} onRetry={fetchFiles} />}
          {!loading && !error && (
            <DriveFileList items={driveItems} onFileClick={handleFileClick} />
          )}
        </div>

        {/* Input Area for chat functionality */}
        <div className="drive-input-area">
          <InputArea
            onSendMessage={handleSendMessage}
            onModelsRequired={handleModelsRequired}
            hasModelsConfigured={true}
          />
        </div>
      </main>

      {/* AI Models Settings Modal */}
      <ModelSettingsModal
        chatId={currentChatId || undefined}
        isOpen={
          modals.isAIModelsSettingsOpen || modals.isDefaultModelsModalOpen
        }
        onClose={() => {
          handleCloseAIModelsSettings();
          handleCloseDefaultModelsModal();
        }}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={modals.isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onSwitchToRegister={switchToRegister}
      />

      {/* Register Modal */}
      <RegisterModal
        isOpen={modals.isRegisterModalOpen}
        onClose={handleCloseRegisterModal}
        onSwitchToLogin={switchToLogin}
      />

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewerModal
          isOpen={fileViewerOpen}
          onClose={closeFileViewer}
          fileName={selectedFile.filename}
          fileUrl={selectedFile.url}
          contentType={selectedFile.content_type}
        />
      )}
    </div>
  );
};

export default MyDriveView;
