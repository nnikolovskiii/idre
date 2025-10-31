// src/services/file.ts

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
    content: string;
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

// --- NEW INTERFACES START ---

/**
 * The payload for updating a file's details.
 * All fields are optional.
 */
export interface UpdateFilePayload {
    filename?: string;
    notebook_id?: string;
    content?: string;
}

/**
 * The structure of the 'data' object in the update file API response.
 */
export interface UpdatedFileData {
    file_id: string;
    filename: string;
    unique_filename: string;
    url: string;
    content_type: string | null;
    file_size: string;
    processing_status: string;
    created_at: string | null;
    updated_at: string | null;
}

/**
 * The full API response for a successful file update.
 */
export interface UpdateFileApiResponse {
    status: string;
    message: string;
    data: UpdatedFileData;
}

// --- NEW INTERFACES END ---


// Configuration
const FILE_SERVICE_URL = API_CONFIG.getApiUrl() + '/files'

// Upload service
export const fileService = {
    /**
     * Upload a file
     * Endpoint: POST /files/upload
     */
    uploadFile: async (file: File, notebook_id?: string | undefined, transcribe: boolean = true): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        let uploadUrl = `${FILE_SERVICE_URL}/upload`;
        const params = new URLSearchParams();
        if (notebook_id) {
            params.append('notebook_id', notebook_id);
        }
        params.append('transcribe', transcribe.toString());
        if (params.toString()) {
            uploadUrl += `?${params.toString()}`;
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

    /**
     * Update a file's details.
     * Endpoint: PATCH /files/{file_id}
     */
    updateFile: async (file_id: string, updates: UpdateFilePayload): Promise<UpdateFileApiResponse> => {
        const response = await fetch(`${FILE_SERVICE_URL}/${file_id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update file: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    /**
     * Download a file by file_id
     * Endpoint: GET /files/download/{file_id}
     * Returns the file content as a Blob
     */
    downloadFile: async (file_id: string): Promise<Blob> => {
        const response = await fetch(`${FILE_SERVICE_URL}/download/${file_id}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`File download failed: ${response.statusText} (${errorText})`);
        }

        return response.blob();
    },

    /**
     * Delete a file
     * Endpoint: DELETE /files/{file_id}
     */
    deleteFile: async (file_id: string): Promise<void> => {
        const response = await fetch(`${FILE_SERVICE_URL}/${file_id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`File deletion failed: ${response.statusText} (${errorText})`);
        }
    },
};
