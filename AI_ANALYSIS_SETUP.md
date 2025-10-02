# AI Analysis Setup Guide

## Overview

The ChatMind application now includes a comprehensive AI analysis system with multiple model support. The system uses Ollama as the primary AI model with fallback support for OpenAI and Google Gemini.

## Features Implemented

### ✅ Multi-Model AI Support
- **Primary**: Ollama (local AI model)
- **Fallback 1**: OpenAI GPT-3.5-turbo
- **Fallback 2**: Google Gemini Pro
- Automatic failover between models
- Model availability checking

### ✅ Enhanced AI Analysis
- Comprehensive trading insights generation
- Multiple coach personas (Mentor Guru, Technical Analyst, Risk Manager, Psychology Coach)
- Indian market context integration
- Explainable AI insights
- Real-time model selection

### ✅ Report Download Functionality
- JSON format for data analysis
- CSV format for spreadsheet integration
- HTML format for PDF conversion
- Automatic file naming with timestamps

### ✅ Frontend Integration
- Coach persona selection
- Model indicator display
- Download buttons for multiple formats
- Enhanced error handling and user feedback

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file with the following AI configuration:

```env
# AI Model Configuration
# Primary AI Model (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Fallback AI Models
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro

# Configure which models to use (comma-separated, in order of preference)
AI_MODELS_ENABLED=ollama,openai,gemini
```

### 2. Ollama Setup (Primary Model)

#### Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

#### Pull Required Model
```bash
# Pull Llama 2 model (recommended)
ollama pull llama2

# Alternative models you can use:
ollama pull codellama
ollama pull mistral
ollama pull neural-chat
```

#### Start Ollama Service
```bash
ollama serve
```

### 3. OpenAI Setup (Fallback Model)

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add the key to your `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 4. Google Gemini Setup (Fallback Model)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the key to your `.env` file:
   ```env
   GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```

### 5. Model Configuration Options

You can configure which models to use by modifying the `AI_MODELS_ENABLED` environment variable:

```env
# Use only Ollama
AI_MODELS_ENABLED=ollama

# Use Ollama with OpenAI fallback
AI_MODELS_ENABLED=ollama,openai

# Use all three models
AI_MODELS_ENABLED=ollama,openai,gemini

# Use only cloud models (no Ollama)
AI_MODELS_ENABLED=openai,gemini
```

## Usage

### 1. Generate AI Analysis

1. Navigate to the Analysis page
2. Select a coach persona from the dropdown:
   - **Mentor Guru**: Traditional wisdom-based coaching
   - **Technical Analyst**: Chart and pattern-focused analysis
   - **Risk Manager**: Risk management and position sizing focus
   - **Psychology Coach**: Behavioral and emotional trading analysis
3. Click "Generate AI Report"
4. The system will automatically try models in order of preference

### 2. Download Reports

After generating a report, you can download it in multiple formats:

- **JSON**: Raw data format for further analysis
- **CSV**: Spreadsheet-compatible format
- **PDF**: HTML format that can be converted to PDF

### 3. Model Status

The system will show which AI model was used for the analysis in the report header.

## Troubleshooting

### Ollama Issues

**Problem**: Ollama not responding
**Solution**: 
```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
ollama serve
```

**Problem**: Model not found
**Solution**:
```bash
# Pull the required model
ollama pull llama2
```

### OpenAI Issues

**Problem**: API key invalid
**Solution**: 
1. Verify your API key at [OpenAI Platform](https://platform.openai.com/api-keys)
2. Check your account has sufficient credits
3. Ensure the key has the correct permissions

### Gemini Issues

**Problem**: API key invalid
**Solution**:
1. Verify your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check your account has sufficient quota
3. Ensure the key is properly formatted

### General Issues

**Problem**: All models failing
**Solution**:
1. Check your internet connection
2. Verify all API keys are correct
3. Check the server logs for detailed error messages
4. Ensure the models are properly configured in your `.env` file

## API Endpoints

### Generate Analysis
```
POST /api/analysis/generate
Body: { "coachPersonaId": "mentor-guru" }
```

### Get Analysis Reports
```
GET /api/analysis/reports
```

### Download Report
```
GET /api/analysis/download/:reportId?format=json|csv|pdf
```

### Get Available Models
```
GET /api/analysis/models
```

## Development Notes

### Adding New Models

To add a new AI model:

1. Create a new client class implementing `AIModelClient` interface
2. Add it to the `MultiModelClient` constructor
3. Update the environment configuration
4. Add the model to `AI_MODELS_ENABLED`

### Customizing Prompts

Modify the prompt templates in `server/services/ai/promptTemplates.ts` to customize the AI analysis behavior.

### Adding New Coach Personas

Add new personas in `server/services/ai/coachPersonas.ts` and update the frontend dropdown in `client/src/pages/analysis.tsx`.

## Performance Considerations

- Ollama provides the fastest response times for local analysis
- OpenAI offers the most consistent quality
- Gemini provides good balance of speed and quality
- Consider your data privacy requirements when choosing models

## Security Notes

- Ollama runs locally and keeps your data private
- OpenAI and Gemini send data to external servers
- Consider using Ollama for sensitive trading data
- Always use HTTPS in production environments
