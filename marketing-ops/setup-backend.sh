#!/bin/bash

echo "🚀 Setting up Marketing Ops Backend..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install express cors @types/express @types/cors @types/node concurrently

echo ""
echo "✅ Backend dependencies installed!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Copy .env.example to .env:"
echo "   cp .env.example .env"
echo ""
echo "2. Edit .env and add your Supabase credentials:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)"
echo ""
echo "3. Run both frontend and backend:"
echo "   npm run dev:all"
echo ""
echo "   Or run them separately:"
echo "   npm run dev          # Frontend (Terminal 1)"
echo "   npm run dev:backend  # Backend (Terminal 2)"
echo ""
echo "🎉 Setup complete! Check BACKEND_README.md for full documentation."
