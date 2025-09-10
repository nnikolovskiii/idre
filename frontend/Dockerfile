# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# You can pass build-time args here if needed for some environments
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the environment script and make it executable
COPY env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

EXPOSE 3000

# The base image's entrypoint will run env.sh automatically
CMD ["nginx", "-g", "daemon off;"]