import { buildApiUrl } from './api';

// Type definitions
export interface ExecuteCodeRequest {
  code: string;
  language: string;
}

export interface ExecuteCodeResponse {
  output: string;
  error?: string;
  execution_time: number;
}

export interface CodeTemplate {
  id: string;
  name: string;
  language: string;
  code: string;
  description?: string;
}

// Codes service functions
export const codesService = {
  executeCode: async (request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> => {
    const response = await fetch(buildApiUrl('/codes/execute'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute code: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  getCodeTemplates: async (): Promise<CodeTemplate[]> => {
    const response = await fetch(buildApiUrl('/codes/templates'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch code templates: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  saveCodeTemplate: async (template: Omit<CodeTemplate, 'id'>): Promise<CodeTemplate> => {
    const response = await fetch(buildApiUrl('/codes/templates'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save code template: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },
};
