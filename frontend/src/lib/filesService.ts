// Type definitions
export interface FileUploadResponse {
    filename: string;
    file_id: string;
    url: string;
}

// Configuration
const FILE_SERVICE_URL = window.ENV?.VITE_FILE_SERVICE_URL;

// Upload service
export const fileService = {
    uploadFile: async (file: File, uploadPassword: string): Promise<FileUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const uploadUrl = `${FILE_SERVICE_URL}/test/upload`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'password': uploadPassword
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`File upload failed: ${response.status} ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};
