import { buildApiUrl } from './api';

// Type definitions
export interface WebhookPayload {
  event: string;
  data: any;
}

export interface WebhookResponse {
  status: string;
  message?: string;
}

// Webhook service functions
export const webhookService = {
  sendWebhook: async (payload: WebhookPayload): Promise<WebhookResponse> => {
    const response = await fetch(buildApiUrl('/webhook'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send webhook: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },
};
