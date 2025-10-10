import {API_CONFIG} from "./api.ts";

export interface ProcessingResult {
    transcription?: string;
    language?: string;
    duration?: number;
    [key: string]: any; // Allow additional fields
}

export interface FileUploadResponse {
    filename: string;
    file_id: string;
    url: string;
    processing_status: string;
    is_audio: boolean;
}

export interface FileData {
    file_id: string;
    filename: string;
    unique_filename: string;
    url: string;
    content_type: string;
    file_size: string;
    processing_status: string;
    thread_id: string | null;
    run_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    processing_result: ProcessingResult | null;
}

export interface FileListResponse {
    status: string;
    message: string;
    data: Array<FileData>;
}

// Configuration
const FILE_SERVICE_URL = API_CONFIG.getApiUrl() + '/files'

// Upload service
export const fileService = {
    /**
     * Upload a file
     * Endpoint: POST /files/upload
     */
    uploadFile: async (file: File, notebook_id?: string): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        let uploadUrl = `${FILE_SERVICE_URL}/upload`;
        if (notebook_id) {
            uploadUrl += `?notebook_id=${encodeURIComponent(notebook_id)}`;
        }

        const response = await fetch(uploadUrl, {
            method: 'POST',
            credentials: 'include',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`File upload failed: ${response.statusText} (${errorText})`);
        }

        const result = await response.json();
        return {
            filename: result.data.filename,
            file_id: result.data.file_id,
            url: result.data.url,
            processing_status: result.data.processing_status,
            is_audio: result.data.is_audio
        };
    },

    /**
     * Get user files for a notebook
     * Endpoint: GET /files/{notebook_id}
     */
    getUserFiles: async (notebook_id: string): Promise<FileListResponse> => {
        const response = await fetch(`${FILE_SERVICE_URL}/${notebook_id}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch files: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    /**
     * Transcribe an audio file
     * Endpoint: POST /files/transcribe/{notebook_id}
     */
    transcribeFile: async (notebook_id: string, audio_path: string, file_id: string): Promise<void> => {
        const response = await fetch(`${FILE_SERVICE_URL}/transcribe/${notebook_id}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_path,
                file_id
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Transcription failed: ${response.statusText} (${errorText})`);
        }
    },
};