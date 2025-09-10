#!/bin/sh

# Create a config file with environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:?VITE_API_BASE_URL environment variable is not set. Aborting.}",
  VITE_FILE_SERVICE_URL: "${VITE_FILE_SERVICE_URL:?VITE_FILE_SERVICE_URL environment variable is not set. Aborting.}",
  VITE_FILE_UPLOAD_PASSWORD: "${VITE_FILE_UPLOAD_PASSWORD:?VITE_FILE_UPLOAD_PASSWORD environment variable is not set. Aborting.}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID:?VITE_GOOGLE_CLIENT_ID environment variable is not set. Aborting.}",
  VITE_FILE_SERVICE_DOCKER_NETWORK: "${VITE_FILE_SERVICE_DOCKER_NETWORK:?VITE_FILE_SERVICE_DOCKER_NETWORK environment variable is not set. Aborting.}"
};
EOF

# Start Nginx
exec "$@"
