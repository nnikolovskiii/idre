import React, {useState, useRef, type DragEvent, type ChangeEvent, useEffect} from 'react';
import {
    FaFileUpload,
    FaImage,
    FaFileAlt,
    FaVideo,
    FaMusic,
    FaFile,
    FaCloudUploadAlt,
    FaSync,
    FaCheck,
    FaExclamationTriangle,
    FaDownload
} from 'react-icons/fa';
import './FileUpload.css'
import { getFilesUrl } from '../lib/api';

// Types
interface FileWithPreview extends File {
    preview: string;
}

interface FileData {
    filename: string;
    url: string;
    content_type: string;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    thread_id?: string;
    run_id?: string;
    processing_result?: any;
}

// Helper Functions
const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) return 'audio';
    return 'default';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileIcon: React.FC<{ type: string }> = ({type}) => {
    const iconMap: { [key: string]: React.ReactNode } = {
        image: <FaImage/>,
        document: <FaFileAlt/>,
        video: <FaVideo/>,
        audio: <FaMusic/>,
        default: <FaFile/>,
    };
    return <div className={`file-icon ${type}`}>{iconMap[type]}</div>;
};

const StatusIcon: React.FC<{ status: string }> = ({status}) => {
    const iconMap: { [key: string]: React.ReactNode } = {
        pending: <FaFile style={{color: '#718096'}}/>,
        processing: <FaSync className="rotating" style={{color: '#4299e1'}}/>,
        completed: <FaCheck style={{color: '#48bb78'}}/>,
        failed: <FaExclamationTriangle style={{color: '#f56565'}}/>,
    };
    return <div className={`status-icon ${status}`}>{iconMap[status]}</div>;
};

// Main Component
const FileUploadDashboard: React.FC = () => {
    // Upload states
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatus, setUploadStatus] = useState<{ success: boolean, message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // File management states
    const [files, setFiles] = useState<FileData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter] = useState<string>('all');
    const [isPolling, setIsPolling] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<{ success: boolean, message: string } | null>(null);

    // Upload functions
    const addFiles = (files: FileList) => {
        const newFiles = Array.from(files).map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));
        setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(selectedFiles[index].preview);
        setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);
        setUploadStatus(null);
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) {
            setUploadStatus({success: false, message: "No files selected for upload"});
            return;
        }

        setIsUploading(true);
        setUploadStatus(null);

        try {
            const uploadPromises = selectedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(getFilesUrl('UPLOAD'), {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to upload file');
                }

                return await response.json();
            });

            const results = await Promise.all(uploadPromises);

            clearAllFiles();

            setUploadStatus({
                success: true,
                message: `Successfully uploaded ${results.length} file${results.length !== 1 ? 's' : ''}`
            });

            fetchFiles(activeFilter === 'all' ? undefined : activeFilter);
        } catch (error) {
            setUploadStatus({
                success: false,
                message: error instanceof Error ? error.message : 'An unknown error occurred during upload'
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
        }
        e.target.value = '';
    };

    // File management functions
    const fetchFiles = async (status?: string) => {
        setLoading(true);
        setError(null);

        try {
            let url = getFilesUrl('LIST');
            if (status && status !== 'all') {
                url += `?status=${status}`;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }

            const data = await response.json();
            setFiles(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching files');
        } finally {
            setLoading(false);
        }
    };


    const handleDownload = async (filename: string) => {
        try {
            window.open(getFilesUrl('DOWNLOAD', filename), '_blank');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while downloading the file');
        }
    };


    const handlePollResults = async (filename: string) => {
        setIsPolling(true);
        setProcessingStatus(null);

        try {
            const url = getFilesUrl('POLL', filename);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to poll for results');
            }

            const data = await response.json();

            setProcessingStatus({
                success: true,
                message: data.message || 'Started polling for results'
            });

            setTimeout(() => {
                fetchFiles(activeFilter === 'all' ? undefined : activeFilter);
            }, 1000);

        } catch (err) {
            setProcessingStatus({
                success: false,
                message: err instanceof Error ? err.message : 'An error occurred while polling for results'
            });
        } finally {
            setIsPolling(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <>

            <div className="dashboard-container">
                {/* Upload Section - Left Column */}
                <div className="upload-column">
                    <div className="upload-section">
                        <h2 className="section-title">Upload Files</h2>

                        <div
                            className="drop-zone"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span className="upload-icon"><FaFileUpload/></span>
                            <h3>Drag & Drop Files Here</h3>
                            <p>or click to browse your computer</p>
                            <button className="browse-button" onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}>
                                Browse Files
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="file-input"
                            multiple
                            onChange={handleFileChange}
                        />

                        {selectedFiles.length > 0 && (
                            <div className="file-list">
                                <div className="file-list-header">
                                    <h3 className="file-list-title">Selected Files ({selectedFiles.length})</h3>
                                    <div className="file-list-actions">
                                        <button
                                            className="upload-btn"
                                            onClick={uploadFiles}
                                            disabled={isUploading}
                                        >
                                            <FaCloudUploadAlt/>
                                            {isUploading ? 'Uploading...' : 'Upload Files'}
                                        </button>
                                        <button
                                            className="clear-all-btn"
                                            onClick={clearAllFiles}
                                            disabled={isUploading}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {uploadStatus && (
                                    <div className={`upload-status ${uploadStatus.success ? 'success' : 'error'}`}>
                                        {uploadStatus.message}
                                    </div>
                                )}

                                <div className="selected-files-list">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="selected-file-item">
                                            <div className="selected-file-content">
                                                <FileIcon type={getFileType(file.name)}/>
                                                <div className="selected-file-details">
                                                    <div className="selected-file-name"
                                                         title={file.name}>{file.name}</div>
                                                    <div
                                                        className="selected-file-size">{formatFileSize(file.size)}</div>
                                                </div>
                                            </div>
                                            <button
                                                className="remove-button"
                                                onClick={() => removeFile(index)}
                                                disabled={isUploading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Files Management Section - Right Column */}
                <div className="files-column">
                    <div className="files-container">
                        <h2 className="section-title">File Management</h2>


                        {/* Processing status message */}
                        {processingStatus && (
                            <div className={`processing-status ${processingStatus.success ? 'success' : 'error'}`}>
                                {processingStatus.message}
                            </div>
                        )}

                        {/* Loading and error states */}
                        {loading && <div className="loading-message">Loading files...</div>}
                        {error && <div className="error-message">{error}</div>}

                        {/* Files list */}
                        {!loading && !error && files.length === 0 && (
                            <div className="empty-state">
                                <FaFile size={48} color="#a0aec0"/>
                                <p>No files found. Upload some files to get started.</p>
                            </div>
                        )}

                        {!loading && !error && files.length > 0 && (
                            <div className="files-list">
                                <div className="files-table">
                                    <div className="table-header">
                                        <div className="col-icon"></div>
                                        <div className="col-filename">Filename</div>
                                        <div className="col-status">Status</div>
                                        <div className="col-actions">Actions</div>
                                    </div>
                                    {files.map((file, index) => (
                                        <div key={index} className="table-row">
                                            <div className="col-icon">
                                                <FileIcon type={getFileType(file.filename)}/>
                                            </div>
                                            <div className="col-filename">
                        <span className="filename-text" title={file.filename}>
                          {file.filename}
                        </span>
                                            </div>
                                            <div className="col-status">
                                                <div className="status-container">
                                                    <StatusIcon status={file.processing_status}/>
                                                    <span className={`status-text ${file.processing_status}`}>
                            {file.processing_status.charAt(0).toUpperCase() + file.processing_status.slice(1)}
                          </span>
                                                </div>
                                            </div>
                                            <div className="col-actions">
                                                <button
                                                    className="action-button download"
                                                    onClick={() => handleDownload(file.filename)}
                                                    title="Download file"
                                                >
                                                    <FaDownload/>
                                                </button>
                                                {file.processing_status === 'processing' && (
                                                    <button
                                                        className="action-button poll"
                                                        onClick={() => handlePollResults(file.filename)}
                                                        disabled={isPolling}
                                                        title="Poll results"
                                                    >
                                                        <FaSync className={isPolling ? 'rotating' : ''}/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default FileUploadDashboard;
