# Deployment Guide for Tempo Playlist Generator

## Current Status
Your React app is deployed on GitHub Pages at: https://jrog20.github.io/tempo-playlist-generator/#/

However, the backend server needs to be deployed to make the app fully functional.

## Step 1: Deploy Backend to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name (e.g., `tempo-playlist-backend`)
   - Deploy

4. **Get your backend URL** from the deployment output (e.g., `https://tempo-playlist-backend.vercel.app`)

## Step 2: Set Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret  
- `SPOTIFY_REDIRECT_URI`: `https://jrog20.github.io/tempo-playlist-generator/callback`
- `FRONTEND_URL`: `https://jrog20.github.io`
- `OPENAI_API_KEY`: Your OpenAI API key (for BPM estimation)

## Step 3: Update Frontend Configuration

1. **Update the backend URL** in `src/services/musicService.ts`:
   Replace `'https://your-backend-url.vercel.app'` with your actual Vercel URL.

2. **Set environment variable** (optional):
   Create a `.env` file in your project root:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app
   ```

## Step 4: Redeploy Frontend

After updating the backend URL:

```bash
npm run deploy
```

## Step 5: Test the App

1. Visit https://jrog20.github.io/tempo-playlist-generator/#/
2. Try logging in with Spotify
3. Test generating a playlist

## Alternative Backend Hosting Options

If you prefer not to use Vercel, you can also deploy to:

- **Railway**: https://railway.app/
- **Render**: https://render.com/
- **Heroku**: https://heroku.com/ (requires credit card)
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

## Troubleshooting

### CORS Issues
If you see CORS errors, make sure your backend's CORS configuration includes your GitHub Pages URL.

### Environment Variables
Make sure all required environment variables are set in your hosting platform.

### Spotify API Limits
The free tier of Spotify API has rate limits. Consider implementing caching if you expect high traffic.

## Security Notes

- Never commit API keys to your repository
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production use
