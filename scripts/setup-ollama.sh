#!/bin/bash

# ChatMind AI Analysis Setup Script
# This script helps set up Ollama for local AI analysis

echo "🚀 ChatMind AI Analysis Setup"
echo "=============================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed."
    echo ""
    echo "Please install Ollama first:"
    echo ""
    echo "macOS/Linux:"
    echo "curl -fsSL https://ollama.ai/install.sh | sh"
    echo ""
    echo "Windows:"
    echo "Download from https://ollama.ai/download"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama service is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama service is not running."
    echo "Starting Ollama service..."
    ollama serve &
    sleep 3
    
    # Check again
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ Failed to start Ollama service."
        echo "Please start it manually: ollama serve"
        exit 1
    fi
fi

echo "✅ Ollama service is running"

# Check if llama2 model is available
if ! ollama list | grep -q "llama2"; then
    echo "📥 Downloading llama2 model (this may take a few minutes)..."
    ollama pull llama2
    
    if [ $? -eq 0 ]; then
        echo "✅ llama2 model downloaded successfully"
    else
        echo "❌ Failed to download llama2 model"
        echo "You can try alternative models:"
        echo "  ollama pull codellama"
        echo "  ollama pull mistral"
        echo "  ollama pull neural-chat"
        exit 1
    fi
else
    echo "✅ llama2 model is available"
fi

# Test the model
echo "🧪 Testing AI model..."
TEST_RESPONSE=$(ollama run llama2 "Hello, are you working?" 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$TEST_RESPONSE" ]; then
    echo "✅ AI model is working correctly"
    echo ""
    echo "🎉 Setup complete! Your ChatMind AI analysis is ready."
    echo ""
    echo "You can now:"
    echo "1. Start your ChatMind server: npm run dev"
    echo "2. Go to the Analysis page"
    echo "3. Generate AI reports using Ollama"
    echo ""
    echo "Note: Ollama runs locally and keeps your trading data private."
else
    echo "❌ AI model test failed"
    echo "Please check your Ollama installation and try again."
    exit 1
fi
