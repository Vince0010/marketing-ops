# AI Service Setup Guide

## Overview
This application now uses **Groq's free API** for AI-powered campaign recommendations. Groq offers a permanent free tier with fast inference and CORS support for browser calls.

## Getting Your Free API Key

### Step 1: Create a Groq Account
1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account (requires email, no credit card)

### Step 2: Generate an API Key
1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Click "Create API Key"
3. Give it a name (e.g., "Marketing Ops App")
4. Copy the key (starts with `gsk_...`)

### Step 3: Add to Environment File
1. Open your `.env` file
2. Add your key:
   ```
   VITE_GROQ_API_KEY=gsk_your_key_here
   ```
3. Save the file
4. Restart your development server

## Model Information

**Model**: Llama 3.3 70B Versatile
- **Provider**: Groq (ultra-fast inference)
- **Cost**: FREE (rate-limited)
- **Limits**: 30 requests/minute, 14,400 requests/day
- **Performance**: Excellent at structured output, fast response times (~1-2 seconds)
- **CORS**: ✅ Enabled (works directly from browser)

## Features & Limitations

### ✅ What's Free Forever
- Unlimited API key usage (no expiration)
- 14,400 requests per day on free tier
- No credit card required
- Ultra-fast inference (one of the fastest available)
- Direct browser calls (no proxy needed)

### ⚠️ Rate Limits
- Free tier: 30 requests/minute, 14,400/day
- Sufficient for development and small teams
- If you hit limits, wait a minute and try again

### 🚀 If You Need More
- **Groq Cloud Pay-as-you-go**: $0.59/million tokens (very affordable)
- Higher rate limits available
- Still very fast inference

## Troubleshooting

### "API Key Missing" error
- Check `.env` file has `VITE_GROQ_API_KEY` set
- Ensure the file is in the correct directory
- Restart your dev server after adding the key

### Rate limit errors (429)
- You've exceeded 30 requests/minute
- Wait 60 seconds and try again
- Free tier is 14,400 requests/day total

### CORS errors
- Groq API supports CORS by default
- If you see CORS errors, check your API key is valid
- Make sure you're using the latest aiService.ts

## Why Groq?

**Groq** was chosen because:
1. ✅ **Free tier** with no credit expiration
2. ✅ **CORS-enabled** - works directly from browser
3. ✅ **Fast inference** - responses in 1-2 seconds
4. ✅ **Good model** - Llama 3.3 70B is excellent at structured output
5. ✅ **Generous limits** - 14,400 requests/day

## Migration from Hugging Face

Hugging Face was replaced due to CORS restrictions (doesn't allow browser calls). Key changes:
- ✅ API calls migrated to Groq
- ✅ Faster inference (no cold starts)
- ✅ JSON mode for better structured output
- ✅ All recommendation logic preserved

No code changes needed in your components—the interface remains the same.
