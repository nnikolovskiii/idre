import {API_CONFIG} from "./api.ts";

export interface FileUploadResponse {
    filename: string;
    file_id: string;
    url: string;
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
            url: result.data.url
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
};