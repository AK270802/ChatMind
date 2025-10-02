#!/bin/sh
echo "🚀 Starting ChatMind application..."
echo "📊 Environment: $NODE_ENV"
echo "🔌 Port: $PORT"
echo "📁 Working directory: $(pwd)"
echo "📄 Files in dist: $(ls -la dist/ 2>/dev/null || echo 'dist not found')"

# Start the application
exec node dist/index.js

