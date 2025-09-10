interface Window {
  ENV?: {
    VITE_API_URL?: string;
    [key: string]: string | undefined;
  };
}