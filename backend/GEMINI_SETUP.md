# Gemini API Setup Guide

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Configuration

### Backend Setup

Add your Gemini API key to the backend `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Environment Variables

The backend will automatically load the `GEMINI_API_KEY` from environment variables.

## Testing

Once configured, you can test the AI chat feature:

1. Start the backend server
2. Go to the AI Advice page in the frontend
3. Try asking questions like:
   - "Which route is safer for a jog at 7 AM?"
   - "Which areas have the cleanest air this week?"

## API Endpoint

- **POST** `/api/ai/chat`
- **Body**: `{ "query": "your question here" }`
- **Response**: `{ "success": true, "data": { "response": "AI response text" } }`

## Model Used

- **Model**: `gemini-2.5-flash` (default, fast and efficient)
- **Temperature**: 0.7 (for balanced creativity)
- **Max Tokens**: 1024

### Changing the Model

The default model is already configured. To use a different model, add to `backend/.env`:
```env
GEMINI_MODEL=gemini-2.0-flash
```

**Available Models** (verified with your API key):
- `gemini-2.5-flash` (default) - Fast, efficient, recommended
- `gemini-2.5-pro` - More capable for complex queries
- `gemini-2.0-flash` - Stable alternative
- `gemini-pro-latest` - Latest "pro" model
- `gemini-2.5-flash-lite` - Lightweight version
- `gemini-3-pro-preview` - Latest preview (experimental)

**Note**: To check all available models, run:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

### Troubleshooting 404 Errors

If you get a "404 Not Found" error for a model:

1. **Check available models**: List all available models with your API key
2. **Try gemini-pro**: The default `gemini-pro` model should work with v1beta
3. **Verify API version**: Some models may require v1 instead of v1beta

To check available models, use this command (replace YOUR_API_KEY):
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

## Context

The AI is configured with context about Routely being a smart urban travel and safety app in Malaysia, so it will provide relevant answers about:
- Route planning and safety
- Air quality and pollution
- Traffic conditions
- Safe areas and routes
- Best times to travel
- Health and wellbeing related to urban travel

