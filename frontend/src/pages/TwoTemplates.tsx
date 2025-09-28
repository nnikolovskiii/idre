import React, {
  type FC,
  type SVGProps,
  useState,
  useEffect,
  useRef,
} from "react";
import { fileService, type FileUploadResponse } from "../lib/filesService";

// --- SVG ICONS (Self-contained components) ---

const NotebookIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M15 2v20" />
  </svg>
);

const SquareArrowOutUpRightIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
    <path d="m21 3-9 9" />
    <path d="M15 3h6v6" />
  </svg>
);

const PlusIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const CompassIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const FileTextIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const XIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const UploadCloudIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const GoogleDriveIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 10H6" />
    <path d="m2 10 4 12 4-12" />
    <path d="M18 10 14 22l4-12" />
    <path d="m10 2 4 12 4-12" />
    <path d="M2 10h20" />
  </svg>
);

const LinkIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
  </svg>
);

const YoutubeIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 4.24 4.24 2.5 7 2.5h10c2.76 0 4.5 1.74 4.5 4.5v10c0 2.76-1.74 4.5-4.5 4.5H7c-2.76 0-4.5-1.74-4.5-4.5Z" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const ClipboardPasteIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 2H9a2 2 0 0 0-2 2v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2V4a2 2 0 0 0-2-2Z" />
    <path d="M9 2v4h6V2" />
    <path d="M12 12v6" />
    <path d="m15 15-3 3-3-3" />
  </svg>
);

const ClipboardIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

// --- REUSABLE CUSTOM CHECKBOX ---

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

const CustomCheckbox: FC<CustomCheckboxProps> = ({ checked, onChange, id }) => (
  <label htmlFor={id} className="cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <div
      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
        checked
          ? "bg-blue-600 border-blue-600"
          : "bg-gray-700 border border-gray-500"
      }`}
    >
      {checked && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </div>
  </label>
);

// --- TEMPLATE 1: SOURCES PANEL ---

export const SourcesPanel: FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [files, setFiles] = useState<FileUploadResponse[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const fetchedFiles = await fileService.getFiles();
        setFiles(fetchedFiles);
        // Initialize selected based on files
        const initialSelected = new Set(fetchedFiles.map((f) => f.file_id));
        setSelectedFiles(initialSelected);
        setSelectAll(fetchedFiles.length > 0);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [refreshKey]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedFiles(new Set(files.map((f) => f.file_id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleFileSelect = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
    setSelectAll(newSelected.size === files.length && files.length > 0);
  };

  if (loading) {
    return (
      <div className="w-full max-w-sm bg-[#202124] text-gray-200 rounded-lg p-4 font-sans flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sources</h2>
          <button className="text-gray-400 hover:text-white">
            <SquareArrowOutUpRightIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="flex items-center justify-center h-32">
          <span className="text-gray-400">Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-[#202124] text-gray-200 rounded-lg p-4 font-sans flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sources</h2>
        <button className="text-gray-400 hover:text-white">
          <SquareArrowOutUpRightIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-600 rounded-full hover:bg-gray-700 transition-colors">
          <PlusIcon className="w-4 h-4" />
          Add
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-gray-600 rounded-full hover:bg-gray-700 transition-colors">
          <CompassIcon className="w-4 h-4" />
          Discover
        </button>
      </div>

      {/* Source List */}
      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium text-gray-300">
            Select all sources ({files.length})
          </span>
          <CustomCheckbox
            id="select-all"
            checked={selectAll}
            onChange={handleSelectAll}
          />
        </div>

        {files.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-gray-400">
            No files uploaded yet.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.file_id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <FileTextIcon className="w-5 h-5 text-blue-400" />
                <span className="text-sm">{file.filename}</span>
              </div>
              <CustomCheckbox
                id={`source-${file.file_id}`}
                checked={selectedFiles.has(file.file_id)}
                onChange={(checked) => handleFileSelect(file.file_id, checked)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- TEMPLATE 2: ADD SOURCES MODAL ---

export interface AddSourcesModalProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
}

export const AddSourcesModal: FC<AddSourcesModalProps> = ({
  onUploadComplete,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setErrorMessage("");
    let successCount = 0;

    for (const file of files) {
      try {
        await fileService.uploadFile(file);
        successCount++;
      } catch (error) {
        console.error("Upload failed:", error);
        setErrorMessage(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    setUploading(false);

    if (successCount > 0) {
      onUploadComplete?.();
      onClose?.();
    }
  };

  const handleClose = () => {
    setIsDragging(false);
    setUploading(false);
    setErrorMessage("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-3xl bg-[#202124] text-gray-200 rounded-xl p-6 relative flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NotebookIcon className="w-7 h-7 text-gray-300" />
            <h2 className="text-xl font-semibold">Add sources</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-gray-700/80 rounded-full hover:bg-gray-700 transition-colors">
              <CompassIcon className="w-4 h-4" />
              Discover sources
            </button>
            <button
              className="text-gray-400 hover:text-white"
              onClick={handleClose}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Body */}
        <p className="text-gray-400 text-sm">
          Sources let NotebookLM base its responses on the information that
          matters most to you. (Examples: marketing plans, course reading,
          research notes, meeting transcripts, sales documents, etc.)
        </p>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging ? "border-blue-400 bg-blue-900/20" : "border-gray-600"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.mp3,.wav"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="text-gray-300">Uploading files...</p>
            </div>
          ) : (
            <>
              <UploadCloudIcon className="w-10 h-10 text-gray-400 mb-4" />
              <p className="text-gray-300">
                Drag & drop or{" "}
                <span
                  className="font-semibold text-blue-400 cursor-pointer hover:underline"
                  onClick={handleChooseFile}
                >
                  choose file to upload
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
              </p>
            </>
          )}
          {errorMessage && (
            <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
          )}
        </div>

        {/* Source Options Grid */}
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              <GoogleDriveIcon className="w-4 h-4" /> Google Workspace
            </h3>
            <button className="bg-gray-700/80 hover:bg-gray-700 transition-colors rounded-lg p-3 text-left">
              Google Drive
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Link
            </h3>
            <button className="bg-gray-700/80 hover:bg-gray-700 transition-colors rounded-lg p-3 text-left">
              Website
            </button>
            <button className="bg-gray-700/80 hover:bg-gamma-700 transition-colors rounded-lg p-3 text-left flex items-center gap-2">
              <YoutubeIcon className="w-5 h-5" /> YouTube
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
              <ClipboardPasteIcon className="w-4 h-4" /> Paste text
            </h3>
            <button className="bg-gray-700/80 hover:bg-gray-700 transition-colors rounded-lg p-3 text-left flex items-center gap-2">
              <ClipboardIcon className="w-5 h-5" /> Copied text
            </button>
          </div>
        </div>

        {/* Footer with Source Limit */}
        <footer className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Source limit</span>
            <span className="text-xs text-gray-400">1 / 50</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: "2%" }}
            ></div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// --- PARENT COMPONENT TO DISPLAY BOTH TEMPLATES ---

export const TwoTemplates: FC = () => {
  // A state to toggle the modal for demonstration purposes
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#131314] flex items-start justify-center p-8 gap-8">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                  .font-sans { font-family: 'Roboto', sans-serif; }`}
      </style>

      {/* Template 1: The side panel */}
      <SourcesPanel refreshKey={refreshKey} />

      {/* A placeholder for the main content area */}
      <div className="flex-grow flex items-center justify-center h-[500px]">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Show Add Sources Modal
        </button>
      </div>

      {/* Template 2: The modal, conditionally rendered */}
      {isModalOpen && (
        <AddSourcesModal
          onUploadComplete={handleUploadComplete}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TwoTemplates;
