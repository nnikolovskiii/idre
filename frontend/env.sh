#!/bin/sh

# Create a config file with environment variables
cat <<EOF > /usr/share/nginx/html/config.js
window.ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8001}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID}"
};
EOF

# NOTE: Do NOT put 'exec "$@"' here when using /docker-entrypoint.d/