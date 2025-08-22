#!/bin/bash
# 🎨 AI-RFX Frontend Startup Script

echo "🎨 Starting AI-RFX Frontend"
echo "=========================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend project root"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local file exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: No .env.local file found"
    echo "   Please create .env.local and configure:"
    echo "   NEXT_PUBLIC_API_URL=http://localhost:5001"
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Kill any existing processes on port 3000
echo "🧹 Cleaning up existing processes..."
if check_port 3000; then
    echo "   - Stopping processes on port 3000"
    lsof -ti :3000 | xargs kill -9 2>/dev/null
fi

# Wait a moment for port to be freed
sleep 2

# Start the frontend server
echo "⚛️  Starting Frontend Server..."
echo "🌐 App will be available at: http://localhost:3000"
echo "🔗 Make sure backend is running at: http://localhost:5001"
echo "=" * 50

# Start the application
npm run dev
