import React, { useState, useEffect } from "react";

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileUrl: string;
    contentType: string;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({
                                                             isOpen,
                                                             onClose,
                                                             fileName,
                                                             fileUrl,
                                                             contentType,
                                                         }) => {
    const [fileContent, setFileContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        if (isOpen && contentType.startsWith("text/")) {
            fetchFileContent();
        }
    }, [isOpen, contentType, fileUrl]);


    if (!isOpen) return null;

    const isImage = contentType.startsWith("image/");
    const isText = contentType.startsWith("text/");
    const isAudio = contentType.startsWith("audio/");

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-medium text-gray-800 truncate">{fileName}</h3>
                    <button className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 p-1 rounded-full hover:bg-gray-200 transition-colors" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="flex-1 p-5 overflow-auto flex items-center justify-center min-h-[200px]">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <span>Loading file...</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600">
                            <p className="mb-4 text-base">Error: {error}</p>
                            <button onClick={fetchFileContent} className="bg-blue-600 text-white border-none rounded px-4 py-2 cursor-pointer text-sm hover:bg-blue-700 transition-colors">Retry</button>
                        </div>
                    )}
                    {isImage && !loading && (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-[70vh] object-contain rounded"
                            onError={() => setError("Failed to load image")}
                        />
                    )}
                    {isAudio && !loading && !error && (
                        <div className="w-full">
                            <audio
                                controls
                                preload="metadata"
                                className="w-full"
                                onError={() => setError("Failed to load audio")}
                            >
                                <source src={fileUrl} type={contentType} />
                                Your browser does not support the audio element.
                            </audio>
                            <div className="mt-4 text-sm text-gray-600">
                                <p><strong>File:</strong> {fileName}</p>
                                <p><strong>Type:</strong> {contentType}</p>
                            </div>
                        </div>
                    )}
                    {isText && !loading && !error && (
                        <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words m-0 text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 w-full box-border">{fileContent}</pre>
                    )}
                    {!isImage && !isAudio && !isText && !loading && !error && (
                        <div className="text-center text-gray-600">
                            <p className="mb-5 text-base">This file type cannot be previewed in the application.</p>
                            <button
                                onClick={() => window.open(fileUrl, "_blank")}
                                className="bg-blue-600 text-white border-none rounded px-6 py-3 cursor-pointer text-base hover:bg-blue-700 transition-colors"
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

export default FileViewerModal;