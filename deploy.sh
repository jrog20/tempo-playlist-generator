#!/bin/bash

echo "🎵 Tempo Playlist Generator - Deployment Script"
echo "================================================"

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo ""
    echo "🚀 Deployment Options:"
    echo "1. Vercel (Recommended - Free)"
    echo "2. Netlify (Free)"
    echo "3. GitHub Pages (Free)"
    echo "4. Manual deployment"
    
    read -p "Choose deployment option (1-4): " choice
    
    case $choice in
        1)
            echo "Deploying to Vercel..."
            if command -v vercel &> /dev/null; then
                vercel --prod
            else
                echo "Vercel CLI not found. Please install it with: npm i -g vercel"
                echo "Or deploy manually at: https://vercel.com/new"
            fi
            ;;
        2)
            echo "Deploying to Netlify..."
            if command -v netlify &> /dev/null; then
                netlify deploy --prod --dir=build
            else
                echo "Netlify CLI not found. Please install it with: npm i -g netlify-cli"
                echo "Or deploy manually at: https://netlify.com"
            fi
            ;;
        3)
            echo "Deploying to GitHub Pages..."
            if [ -d ".git" ]; then
                npm install --save-dev gh-pages
                npm run deploy
            else
                echo "Not a git repository. Please initialize git first."
            fi
            ;;
        4)
            echo "Manual deployment instructions:"
            echo "1. Upload the 'build' folder to your web server"
            echo "2. Configure your server to serve index.html for all routes"
            echo "3. Your app will be available at your domain"
            ;;
        *)
            echo "Invalid option. Please run the script again."
            ;;
    esac
else
    echo "❌ Build failed! Please check for errors."
    exit 1
fi 