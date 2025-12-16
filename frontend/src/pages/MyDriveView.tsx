import { useParams } from "react-router-dom";
import { PanelLeft, FolderOpen, FilePlus } from "lucide-react";

// Components
import Layout from "../components/layout/Layout";
import SidebarExplorer from "../components/drive/SidebarExplorer";
import FileTabs from "../components/drive/FileTabs";
import AISidebar from "../components/drive/AISidebar";
import MarkdownEditor from "../components/drive/editor/MarkdownEditor";
import ConfirmDialog from "../components/ui/ConfirmDialog";

// Hooks & Context
import { useChats } from "../hooks/useChats";
import { useAuth } from "../contexts/AuthContext";
import { useDriveLogic } from "../hooks/useDriveLogic";

const MyDriveView = () => {
    const { notebookId } = useParams<{ notebookId: string }>();

    // --- APP LOGIC HOOKS ---
    const {
        isAuthenticated,
        user
    } = useAuth();

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

    // --- DRIVE LOGIC HOOK ---
    const {
        // Data
        files,
        fetchFiles,
        // Tabs
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
        fontSize,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
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
        // Rewriting
        rewritingFileId,
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
        confirmDeleteFile,
        initiateCreateFile,
        confirmCreateFile,
        startRecording,
        stopRecording,
        handleRewriteContent,
        folders, // <--- New
        currentFolderId, // <--- New
        setCurrentFolderId, // <--- New
        createFolder,
        moveFile,
        // Context Menu Operations
        onFileDelete,
        onFileRename,
        onFileDownload,
        onFolderDelete,
        onFolderRename,
        // Bulk Operations
        onBulkDelete,
        onBulkDownload,
        // Confirmation Dialog
        confirmDialog,
        setConfirmDialog,
        confirmDelete
    } = useDriveLogic(notebookId);

    // --- RENDER HELPERS ---
    const renderWorkspace = () => {
        if (!activeFile) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 bg-muted/5">
                    <FolderOpen size={48} className="opacity-40" />
                    <p className="text-lg">No document open</p>
                    <p className="text-sm opacity-70">Click the + button to create a new document</p>
                    <button
                        onClick={initiateCreateFile}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <FilePlus size={18} />
                        Create Document
                    </button>
                </div>
            );
        }

        const isImage = activeFile.content_type.startsWith('image/');

        if (!isImage) {
            return (
                <MarkdownEditor
                    content={fileContents[activeFile.file_id] || ""}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                    viewMode={viewMode}
                    fontSize={fontSize}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                />
            );
        }

        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center p-8 bg-muted/10">
                    <img
                        src={activeFile.url}
                        alt={activeFile.filename}
                        className="max-w-full max-h-full object-contain shadow-lg"
                    />
                </div>
            );
        }

        return <div className="p-10 text-center">Preview not available</div>;
    };

    return (
        <Layout {...{notebookId, title: "Files", chatSessions, currentChatId, loadingChats, creatingChat, isTyping, isAuthenticated, user, createNewChat, switchToChat, handleDeleteChat}}>
            <div className="flex h-full w-full bg-background overflow-hidden relative">

                {/* SIDEBAR */}
                {isSidebarVisible && (
                    <div style={{ width: sidebarWidth }} className="h-full shrink-0">
                        <SidebarExplorer
                            files={files}
                            folders={folders} // <--- Pass
                            currentFolderId={currentFolderId} // <--- Pass
                            setCurrentFolderId={setCurrentFolderId} // <--- Pass
                            onCreateFolder={createFolder} // <--- Pass
                            activeFileId={activeFileId}
                            onFileClick={handleOpenFile}
                            onFileDoubleClick={handleDoubleClickFile}
                            onUpload={onUploadInputChange}
                            onCreateFile={initiateCreateFile}
                            onRefresh={fetchFiles}
                            onCloseSidebar={() => setIsSidebarVisible(false)}
                            isFileDirty={isFileDirty}
                            onMoveFile={moveFile} // <--- Pass it here
                            // Context Menu handlers
                            onFileDelete={onFileDelete}
                            onFileRename={onFileRename}
                            onFileDownload={onFileDownload}
                            onFolderDelete={onFolderDelete}
                            onFolderRename={onFolderRename}
                            // Bulk operations
                            onBulkDelete={onBulkDelete}
                            onBulkDownload={onBulkDownload}
                        />
                    </div>
                )}

                {/* RESIZER / TOGGLE */}
                {isSidebarVisible ? (
                    <div
                        className="w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors shrink-0 z-10 bg-border/30"
                        onMouseDown={startResizing}
                    />
                ) : (
                    <div className="w-10 border-r border-border bg-muted/10 flex flex-col items-center py-2 shrink-0">
                        <button
                            onClick={() => setIsSidebarVisible(true)}
                            className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                            title="Open Explorer"
                        >
                            <PanelLeft size={20} />
                        </button>
                    </div>
                )}

                {/* MAIN CONTENT AREA */}
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
                        onDelete={initiateDelete}
                        fontSize={fontSize}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                    />
                    <div className="flex-1 overflow-hidden relative flex justify-center">
                        <div className="w-full max-w-[1800px] h-full relative">
                            {renderWorkspace()}
                        </div>
                    </div>
                </div>

                {/* RIGHT AI SIDEBAR */}
                <AISidebar
                    isRecording={isRecording}
                    onToggleRecording={isRecording ? stopRecording : startRecording}
                    isTranscribingForFile={activeFileId === transcribingFileId}
                    isRewritingForFile={activeFileId === rewritingFileId}
                    activeFile={activeFile}
                    onRewriteContent={handleRewriteContent}
                />

                {/* --- MODALS --- */}

                {/* Create File Modal */}
                {isCreateModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <div className="bg-popover border border-border shadow-2xl rounded-lg w-full max-w-sm p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <FilePlus size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-popover-foreground">Create New Document</h3>
                            </div>
                            <form onSubmit={confirmCreateFile}>
                                <div className="mb-6">
                                    <label className="block text-sm text-muted-foreground mb-2">Document name</label>
                                    <input
                                        type="text"
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        placeholder="e.g. meeting-notes"
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">.md extension will be added automatically</p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newFileName.trim()}
                                        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete File Modal */}
                {fileToDelete && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200">
                        <div className="bg-popover border border-border shadow-2xl rounded-lg w-full max-w-sm p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-semibold mb-2 text-popover-foreground">Delete File?</h3>
                            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete <span className="font-medium text-foreground">{fileToDelete.filename}</span>? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setFileToDelete(null)} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Cancel</button>
                                <button onClick={confirmDeleteFile} className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.isOpen}
                title={confirmDialog.type === 'file' ? 'Delete File' : 'Delete Folder'}
                message={
                    confirmDialog.type === 'file'
                        ? `Are you sure you want to delete "${confirmDialog.name}"? This action cannot be undone.`
                        : `Are you sure you want to delete the folder "${confirmDialog.name}" and all its contents? This action cannot be undone.`
                }
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, type: 'file', id: null, name: null })}
            />
        </Layout>
    );
};

export default MyDriveView;