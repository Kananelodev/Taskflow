# Deploying TaskFlow

## Backend → Render

1. Go to [render.com](https://render.com) → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
4. Add environment variables:
   ```
   PYTHON_VERSION=3.11.8
   GOOGLE_CLIENT_ID=<your_id>
   GOOGLE_CLIENT_SECRET=<your_secret>
   GOOGLE_REDIRECT_URI=https://YOUR_RENDER_URL/auth/callback
   SECRET_KEY=<random_secret>
   FRONTEND_URL=https://YOUR_VERCEL_URL
   CORS_ORIGINS=https://YOUR_VERCEL_URL
   PRODUCTION=true
   ```
5. Deploy

> **Important**: Update the Google Cloud Console redirect URI to match your Render URL.

---

## Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Edit `frontend/vercel.json` — replace `YOUR_BACKEND_URL` with your Render URL
5. Deploy

---

## Post-Deploy Checklist

- [ ] Update Google OAuth redirect URI to `https://YOUR_RENDER_URL/auth/callback`
- [ ] Add your production domain to OAuth consent screen authorized domains
- [ ] Set `PRODUCTION=true` in Render env vars (enables secure cookies)
- [ ] Test the full OAuth flow on production
