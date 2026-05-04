# ZeroPrompt AI Production Deployment Guide

ZeroPrompt AI is now architected as a fully decoupled Full-Stack application:
1. **Frontend:** React + Vite, hosted on Firebase Hosting
2. **Backend API:** Node.js Express server, containerized via Docker and deployed to Google Cloud Run
3. **Database & Auth:** Firebase Auth + Firestore + Storage

## Prerequisites

1. Install Google Cloud SDK (`gcloud`)
2. Install Firebase CLI (`npm i -g firebase-tools`)
3. Initialize both SDKs:
   ```bash
   gcloud auth login
   gcloud config set project plasma-streamer-469211-n5
   firebase login
   firebase use plasma-streamer-469211-n5
   ```

---

## Part 1: Firebase Setup (Database, Storage & Auth)

1. **Enable Services in Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/project/plasma-streamer-469211-n5/overview)
   - Enable **Authentication** (Google & Email/Password providers recommended)
   - Enable **Firestore Database** (Start in production mode)
   - Enable **Firebase Storage**
   
2. **Deploy Security Rules:**
   ZeroPrompt AI includes pre-hardened security rules for isolation.
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

---

## Part 2: Backend Deployment (Google Cloud Run)

The AI processing API has been extracted into a dedicated Express backend (`server.ts`) to ensure API key security and enable high scalability.

1. **Build & Deploy the Cloud Run Service:**
   ```bash
   gcloud run deploy zeroprompt-api \
       --source . \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars="GEMINI_API_KEY=YOUR_ACTUAL_API_KEY" \
       --port 8080
   ```
   *(Note: Replace `YOUR_ACTUAL_API_KEY` with your real Gemini API key.)*

2. **Retrieve the Service URL:**
   Once deployed, the terminal will output a URL (e.g., `https://zeroprompt-api-xyz.a.run.app`). **Copy this URL.**

---

## Part 3: Frontend Deployment (Firebase Hosting)

Now that the backend is live, we must connect the frontend to it.

1. **Set the Backend Endpoint:**
   Create a `.env.production` file in your project root to point the frontend to your Cloud Run deployment:
   ```env
   VITE_API_URL=https://zeroprompt-api-xyz.a.run.app
   ```

2. **Build the Production Bundle:**
   ```bash
   npm run build
   ```
   *(This outputs the static files into the `dist/` directory).*

3. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

---

## 🔒 Security Best Practices Implemented

- **No Client-side keys:** The `GEMINI_API_KEY` exists *only* within the secure Cloud Run instance.
- **Fail-safe Mode:** If the Cloud Run API goes down or hits timeouts during the hackathon demo, the application falls back gracefully without crashing.
- **Data Isolation:** `firestore.rules` and `storage.rules` ensure users can only ever access their own datasets.

## 🛠 Troubleshooting
- **CORS Errors:** If you experience CORS errors, ensure the `FRONTEND_URL` environment variable is set on your Cloud Run deployment to your exact Firebase Hosting URL.
- **Timeout Errors:** The AI models sometimes take up to 45 seconds on large documents. Cloud Run defaults to a 5-minute timeout. If needed, configure it: `--timeout=300`.
- **401 Unauthorized:** Ensure your Firebase Auth setup is fully active in the Console if you implement strict token checks in `server.ts` later on.
