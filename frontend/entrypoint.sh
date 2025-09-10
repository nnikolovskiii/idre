#!/bin/sh
set -e

# The default location where Nginx serves files from
# This is where your Dockerfile copies the 'dist' folder contents
STATIC_DIR="${STATIC_DIR:-/usr/share/nginx/html}"
CONFIG_FILE="${CONFIG_FILE:-$STATIC_DIR/config.js}"

# Use the environment variable, or error if not set
API_URL="${VITE_API_BASE_URL:?VITE_API_BASE_URL environment variable is not set. Aborting.}"
FILE_SERVICE_URL="${VITE_FILE_SERVICE_URL:?VITE_FILE_SERVICE_URL environment variable is not set. Aborting.}"
FILE_UPLOAD_PASSWORD="${VITE_FILE_UPLOAD_PASSWORD:?VITE_FILE_UPLOAD_PASSWORD environment variable is not set. Aborting.}"
GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:?VITE_GOOGLE_CLIENT_ID environment variable is not set. Aborting.}"
FILE_SERVICE_DOCKER_NETWORK="${VITE_FILE_SERVICE_DOCKER_NETWORK:?VITE_FILE_SERVICE_DOCKER_NETWORK environment variable is not set. Aborting.}"

echo "Writing runtime config to ${CONFIG_FILE}"
echo "Searching for JS bundle in: ${STATIC_DIR}/assets" # <-- Added for debugging

# Use a more robust find command. The dot '.' means 'search from here'.
# We first change directory into the static dir.
MAIN_JS=$(cd "$STATIC_DIR" && find . -path './assets/index-*.js' | sed 's|^\./||')

if [ -z "$MAIN_JS" ]; then
  echo "Error: Could not find main JS bundle in ${STATIC_DIR}/assets" >&2
  echo "--- Directory Listing of ${STATIC_DIR} ---" >&2
  ls -lR "$STATIC_DIR" >&2 # <-- This will show us exactly what's in the directory
  echo "---------------------------------------" >&2
  exit 1
fi

echo "Found main JS bundle: /${MAIN_JS}"

# Create the config file in the Nginx html directory
mkdir -p "$(dirname "$CONFIG_FILE")"
cat > "$CONFIG_FILE" <<EOF
// Generated at container startup
window.__APP_CONFIG__ = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL:?VITE_API_BASE_URL environment variable is not set. Aborting.}",
  VITE_FILE_SERVICE_URL: "${VITE_FILE_SERVICE_URL:?VITE_FILE_SERVICE_URL environment variable is not set. Aborting.}",
  VITE_FILE_UPLOAD_PASSWORD: "${VITE_FILE_UPLOAD_PASSWORD:?VITE_FILE_UPLOAD_PASSWORD environment variable is not set. Aborting.}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID:?VITE_GOOGLE_CLIENT_ID environment variable is not set. Aborting.}",
  VITE_FILE_SERVICE_DOCKER_NETWORK: "${VITE_FILE_SERVICE_DOCKER_NETWORK:?VITE_FILE_SERVICE_DOCKER_NETWORK environment variable is not set. Aborting.}"
};

// Now that the config is set, load the main application script
const script = document.createElement('script');
script.type = 'module';
script.src = '/${MAIN_JS}'; // Prepend with a slash to make it an absolute path
document.body.appendChild(script);
EOF

echo "Runtime configuration set successfully."
echo "Entrypoint script finished. Starting Nginx..."

# Start the Nginx server (the original command)
exec "$@"