---
description: Deploy the Vite React application to Google Cloud Run
---

# Deploy to Cloud Run

This workflow guides you through containerizing and deploying your Fudaydiye Commerce application to Google Cloud Run.

## Prerequisites

1.  **Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated.
    ```powershell
    gcloud auth login
    gcloud config set project [YOUR_PROJECT_ID]
    ```

2.  **Docker**: (Optional but recommended for local testing)

## Step 1: Create Dockerfile

Create a file named `Dockerfile` in the root directory:

```dockerfile
# Stage 1: Build
FROM node:18-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## Step 2: Create Nginx Config

Create a file named `nginx.conf` in the root directory to handle SPA routing (fallback to index.html):

```nginx
server {
    listen 8080;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Step 3: Deployment Command

Run the following command to build and deploy directly from source (requires Cloud Build enabled):

```powershell
gcloud run deploy fudaydiye-commerce `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```
