#!/bin/bash

# Quick Setup Script for Groq AI
echo "🤖 Marketing Ops AI Setup"
echo "=========================="
echo ""
echo "This app uses Groq's free API for AI recommendations."
echo ""
echo "📋 Setup Steps:"
echo "1. Go to https://console.groq.com/keys"
echo "2. Create a free account (no credit card needed)"
echo "3. Click 'Create API Key'"
echo "4. Copy the key (starts with gsk_)"
echo ""
read -p "Enter your Groq API key: " api_key

if [ -z "$api_key" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Update .env file
if grep -q "VITE_GROQ_API_KEY=" .env 2>/dev/null; then
    # Update existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/VITE_GROQ_API_KEY=.*/VITE_GROQ_API_KEY=$api_key/" .env
    else
        # Linux
        sed -i "s/VITE_GROQ_API_KEY=.*/VITE_GROQ_API_KEY=$api_key/" .env
    fi
    echo "✅ Updated existing VITE_GROQ_API_KEY in .env"
else
    # Add new key
    echo "VITE_GROQ_API_KEY=$api_key" >> .env
    echo "✅ Added VITE_GROQ_API_KEY to .env"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  npm run dev    # Start the development server"
echo ""
echo "📊 Free tier limits:"
echo "  • 30 requests/minute"
echo "  • 14,400 requests/day"
echo "  • Fast inference (~1-2 seconds)"
echo ""
