# 🎵 Tempo Playlist Generator

A beautiful web application that generates music playlists based on tempo and duration. Users can input a reference song and desired duration, and the app will create a curated playlist that maintains the same rhythm and energy.

## ✨ Features

- **Tempo-based Playlist Generation**: Creates playlists with songs that match the tempo of your reference song
- **Genre Consistency**: Maintains similar genres while prioritizing tempo matching
- **Duration Control**: Specify exactly how long you want your playlist to be
- **Beautiful UI**: Modern, responsive design with glass morphism effects
- **Free to Use**: No API keys or paid services required
- **Mobile Friendly**: Works perfectly on all devices

## 🚀 Live Demo

[Deploy to Vercel](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tempo-playlist-generator)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Deployment**: Vercel (Free) / Netlify (Free) / GitHub Pages (Free)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tempo-playlist-generator.git
   cd tempo-playlist-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

1. **Enter a Reference Song**: Type in the name of a song you like
2. **Enter the Artist**: Provide the artist name for better matching
3. **Set Duration**: Use the slider to choose how long you want your playlist (15-120 minutes)
4. **Generate**: Click the "Generate Playlist" button
5. **Enjoy**: Your tempo-matched playlist will appear with song details and Spotify links

## 🌐 Free Deployment Options

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy with one click

### Option 2: Netlify
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect your repository
4. Build command: `npm run build`
5. Publish directory: `build`

### Option 3: GitHub Pages
1. Add to `package.json`:
   ```json
   {
     "homepage": "https://yourusername.github.io/tempo-playlist-generator",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```
2. Install gh-pages: `npm install --save-dev gh-pages`
3. Deploy: `npm run deploy`

## 🔧 Customization

### Adding Real Music APIs

To integrate with real music services, you can modify the `MusicService` class:

1. **Spotify API** (requires authentication):
   ```typescript
   // Add to musicService.ts
   const SPOTIFY_CLIENT_ID = 'your_client_id';
   const SPOTIFY_CLIENT_SECRET = 'your_client_secret';
   ```

2. **OpenAI API** (requires API key):
   ```typescript
   const OPENAI_API_KEY = 'your_openai_api_key';
   ```

3. **MusicBrainz API** (completely free):
   ```typescript
   // No API key required
   ```

### Expanding the Song Database

Add more songs to the `mockSongs` array in `src/services/musicService.ts`:

```typescript
{
  id: 'unique_id',
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  tempo: 120, // BPM
  genre: 'Rock',
  duration: 240, // seconds
  spotifyId: 'spotify_track_id'
}
```

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile devices. Key features:

- Touch-friendly interface
- Responsive design
- Optimized for all screen sizes
- Fast loading times

## 🎨 UI/UX Features

- **Glass Morphism**: Modern translucent design
- **Smooth Animations**: Fade-in effects and hover states
- **Gradient Backgrounds**: Beautiful purple-to-blue gradients
- **Custom Slider**: Styled range input for duration selection
- **Loading States**: Animated loading indicators
- **Error Handling**: User-friendly error messages

## 🔮 Future Enhancements

- [ ] Real-time music streaming integration
- [ ] User accounts and saved playlists
- [ ] Advanced filtering options
- [ ] Export playlists to Spotify/Apple Music
- [ ] Collaborative playlist creation
- [ ] Mood-based recommendations
- [ ] BPM visualization
- [ ] Audio preview functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Built with [React](https://reactjs.org/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact us at [your-email@example.com](mailto:your-email@example.com).

---

**Made with ❤️ for music lovers everywhere**
