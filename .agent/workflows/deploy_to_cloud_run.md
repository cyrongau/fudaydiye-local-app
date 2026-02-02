---
description: Deploy the application to Cloud Run (cacc-webapp-system project)
---

# Deploy to Cloud Run

This workflow deploys the Fudaydiye Commerce application to Google Cloud Run in the `cacc-webapp-system` project.

## Prerequisites

1. **Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated.
   ```powershell
   gcloud auth login
   gcloud config set project cacc-webapp-system
   ```

2. **Correct Project**: Always verify you're using the correct project:
   ```powershell
   gcloud config get-value project
   # Should output: cacc-webapp-system
   ```

## Deployment Command

// turbo
Run the following command to build and deploy:

```powershell
gcloud run deploy fudaydiye-commerce `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --project cacc-webapp-system
```

## What This Does

1. **Builds** the application using Cloud Build
2. **Creates** a container image
3. **Deploys** to Cloud Run service `fudaydiye-commerce`
4. **Routes** traffic to the new revision
5. **Updates** the custom domain `fudaydiye.com`

## Deployment Time

- **Build**: ~2-3 minutes
- **Deploy**: ~1-2 minutes
- **Total**: ~3-5 minutes

## Post-Deployment

After deployment completes:

1. **Service URL**: https://fudaydiye-commerce-1097895058938.us-central1.run.app
2. **Custom Domain**: https://fudaydiye.com
3. **Verify**: Visit the site to confirm changes are live

## Troubleshooting

### Wrong Project Error

If you see "project not found" or permission errors:

```powershell
gcloud config set project cacc-webapp-system
gcloud auth login
```

### Build Fails

Check the build logs:
```powershell
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

### Old Version Still Showing

1. Wait 1-2 minutes for traffic routing
2. Hard refresh browser: `Ctrl + Shift + R`
3. Check Cloud Run revisions:
   ```powershell
   gcloud run revisions list --service=fudaydiye-commerce --region=us-central1
   ```
