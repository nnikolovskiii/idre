import React from "react";

interface TranscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transcription: string;
    filename: string;
}

const TranscriptionModal: React.FC<TranscriptionModalProps> = ({ isOpen, onClose, transcription, filename }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-medium text-gray-800 truncate">Transcription for {filename}</h3>
                    <button className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 p-1 rounded-full hover:bg-gray-200 transition-colors" onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className="flex-1 p-5 overflow-auto">
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words m-0 text-gray-800 bg-gray-50 p-4 rounded border border-gray-200 w-full box-border">{transcription}</pre>
                </div>
            </div>
        </div>
    );
};

export default TranscriptionModal;