/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_FILE_SERVICE_URL?: string
  readonly VITE_FILE_UPLOAD_PASSWORD?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_FILE_SERVICE_DOCKER_NETWORK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}