#!/bin/bash

# Social Authentication Setup Script for Vue UberEat
# This script helps set up the social authentication configuration

echo "🚀 Vue UberEat Social Authentication Setup"
echo "=========================================="
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local result
    
    read -p "$prompt [$default]: " result
    echo "${result:-$default}"
}

# Function to check if file exists
check_file() {
    if [ ! -f "$1" ]; then
        echo "❌ File not found: $1"
        return 1
    fi
    return 0
}

echo "📋 Checking current configuration..."
echo ""

# Check backend .env file
BACKEND_ENV_FILE="backend/.env"
if check_file "$BACKEND_ENV_FILE"; then
    echo "✅ Backend .env file found"
else
    echo "📝 Creating backend .env file from example..."
    if check_file "backend/.env.example"; then
        cp backend/.env.example "$BACKEND_ENV_FILE"
        echo "✅ Backend .env file created"
    else
        echo "❌ Backend .env.example not found"
        exit 1
    fi
fi

# Check frontend .env.local file
FRONTEND_ENV_FILE="frontend/.env.local"
if check_file "$FRONTEND_ENV_FILE"; then
    echo "✅ Frontend .env.local file found"
else
    echo "📝 Creating frontend .env.local file..."
    cat > "$FRONTEND_ENV_FILE" << 'EOF'
# Social Login Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here

# Firebase Configuration (optional)
VITE_USE_FIREBASE=false
EOF
    echo "✅ Frontend .env.local file created"
fi

echo ""
echo "🔧 Social Authentication Configuration"
echo "======================================"
echo ""

# Prompt for Google configuration
echo "📧 Google OAuth Configuration"
echo "------------------------------"
echo "To get your Google Client ID:"
echo "1. Go to https://console.cloud.google.com/"
echo "2. Create a new project or select existing"
echo "3. Enable Google+ API"
echo "4. Create OAuth 2.0 credentials"
echo "5. Add authorized redirect URIs"
echo ""

GOOGLE_CLIENT_ID=$(prompt_with_default "Google Client ID" "your_google_client_id_here")
GOOGLE_CLIENT_SECRET=$(prompt_with_default "Google Client Secret" "your_google_client_secret_here")

echo ""
echo "📘 Facebook OAuth Configuration"
echo "--------------------------------"
echo "To get your Facebook App ID:"
echo "1. Go to https://developers.facebook.com/"
echo "2. Create a new app"
echo "3. Add Facebook Login product"
echo "4. Configure OAuth redirect URIs"
echo ""

FACEBOOK_APP_ID=$(prompt_with_default "Facebook App ID" "your_facebook_app_id_here")
FACEBOOK_APP_SECRET=$(prompt_with_default "Facebook App Secret" "your_facebook_app_secret_here")

echo ""
echo "🔐 JWT Configuration"
echo "--------------------"

JWT_SECRET=$(prompt_with_default "JWT Secret" "$(openssl rand -base64 32)")
JWT_REFRESH_SECRET=$(prompt_with_default "JWT Refresh Secret" "$(openssl rand -base64 32)")

echo ""
echo "💾 Updating configuration files..."

# Update backend .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$BACKEND_ENV_FILE"
    sed -i '' "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET|" "$BACKEND_ENV_FILE"
    sed -i '' "s|FACEBOOK_APP_ID=.*|FACEBOOK_APP_ID=$FACEBOOK_APP_ID|" "$BACKEND_ENV_FILE"
    sed -i '' "s|FACEBOOK_APP_SECRET=.*|FACEBOOK_APP_SECRET=$FACEBOOK_APP_SECRET|" "$BACKEND_ENV_FILE"
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$BACKEND_ENV_FILE"
    sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" "$BACKEND_ENV_FILE"
else
    # Linux
    sed -i "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$BACKEND_ENV_FILE"
    sed -i "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET|" "$BACKEND_ENV_FILE"
    sed -i "s|FACEBOOK_APP_ID=.*|FACEBOOK_APP_ID=$FACEBOOK_APP_ID|" "$BACKEND_ENV_FILE"
    sed -i "s|FACEBOOK_APP_SECRET=.*|FACEBOOK_APP_SECRET=$FACEBOOK_APP_SECRET|" "$BACKEND_ENV_FILE"
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$BACKEND_ENV_FILE"
    sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" "$BACKEND_ENV_FILE"
fi

# Update frontend .env.local file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|VITE_GOOGLE_CLIENT_ID=.*|VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$FRONTEND_ENV_FILE"
    sed -i '' "s|VITE_FACEBOOK_APP_ID=.*|VITE_FACEBOOK_APP_ID=$FACEBOOK_APP_ID|" "$FRONTEND_ENV_FILE"
else
    # Linux
    sed -i "s|VITE_GOOGLE_CLIENT_ID=.*|VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$FRONTEND_ENV_FILE"
    sed -i "s|VITE_FACEBOOK_APP_ID=.*|VITE_FACEBOOK_APP_ID=$FACEBOOK_APP_ID|" "$FRONTEND_ENV_FILE"
fi

echo "✅ Backend configuration updated"
echo "✅ Frontend configuration updated"

echo ""
echo "🌐 OAuth Redirect URIs Configuration"
echo "===================================="
echo ""
echo "For development, add these redirect URIs to your OAuth providers:"
echo ""
echo "Google OAuth:"
echo "  - http://localhost:3000/auth/google/callback"
echo "  - http://localhost:5000/api/auth/google/callback"
echo ""
echo "Facebook OAuth:"
echo "  - http://localhost:3000/auth/facebook/callback"
echo "  - http://localhost:5000/api/auth/facebook/callback"
echo ""

echo "📝 Next Steps"
echo "============="
echo ""
echo "1. 🔧 Configure OAuth providers with the redirect URIs above"
echo "2. 🗄️  Set up your database (see README.md for details)"
echo "3. 📦 Install dependencies:"
echo "   Backend:  cd backend && npm install"
echo "   Frontend: cd frontend && npm install"
echo "4. 🚀 Start the development servers:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo "5. 🧪 Test the social authentication at http://localhost:3000"
echo ""
echo "📚 For detailed documentation, see SOCIAL_AUTH_README.md"
echo ""

# Check if we should run npm install
read -p "Would you like to install dependencies now? (y/N): " install_deps

if [[ $install_deps == "y" || $install_deps == "Y" ]]; then
    echo ""
    echo "📦 Installing backend dependencies..."
    cd backend && npm install
    
    echo ""
    echo "📦 Installing frontend dependencies..."
    cd ../frontend && npm install
    
    echo "✅ Dependencies installed successfully!"
fi

echo ""
echo "🎉 Social Authentication setup complete!"
echo ""
echo "⚠️  Remember to:"
echo "   - Keep your OAuth secrets secure"
echo "   - Use HTTPS in production"
echo "   - Configure CORS properly"
echo "   - Set up proper error monitoring"
echo ""
echo "Happy coding! 🚀"