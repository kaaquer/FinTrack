#!/bin/bash

echo "🚀 Starting FinTrack Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if config.env exists
if [ ! -f "config.env" ]; then
    echo "⚠️  config.env not found. Creating from template..."
    cat > config.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./database/fintrack.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
EOF
    echo "✅ config.env created. Please review and update as needed."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
fi

# Initialize database if it doesn't exist
if [ ! -f "database/fintrack.db" ]; then
    echo "🗄️  Initializing database..."
    npm run init-db
fi

# Start the server
echo "🌐 Starting server..."
npm run dev 