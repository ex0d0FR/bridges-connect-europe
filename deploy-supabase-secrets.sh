#!/bin/bash

# Deploy Supabase Secrets Script
# This script helps you set up the required environment variables in your Supabase project

echo "🚀 Deploying Twilio secrets to Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    echo "   Or visit: https://supabase.com/docs/reference/cli/installing"
    exit 1
fi

# Check if we're logged in
echo "📝 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ You're not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready"

# Prompt for Twilio credentials
echo ""
echo "📱 Please provide your Twilio credentials:"
echo "   You can find these at: https://console.twilio.com/"
echo ""

read -p "🔑 Twilio Account SID (starts with AC...): " TWILIO_ACCOUNT_SID
read -p "🔐 Twilio Auth Token: " TWILIO_AUTH_TOKEN
read -p "📞 Twilio Phone Number (format: +1234567890): " TWILIO_PHONE_NUMBER

# Optional Messaging Service SID
echo ""
read -p "📨 Twilio Messaging Service SID (optional, press Enter to skip): " TWILIO_MESSAGING_SERVICE_SID

# Validate inputs
if [[ -z "$TWILIO_ACCOUNT_SID" || -z "$TWILIO_AUTH_TOKEN" || -z "$TWILIO_PHONE_NUMBER" ]]; then
    echo "❌ Missing required Twilio credentials. Please try again."
    exit 1
fi

# Set the project reference
PROJECT_REF="ovoldtknfdyvyypadnmf"

echo ""
echo "🔧 Deploying secrets to Supabase project: $PROJECT_REF"

# Deploy the secrets
echo "   Setting TWILIO_ACCOUNT_SID..."
supabase secrets set --project-ref=$PROJECT_REF TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID"

echo "   Setting TWILIO_AUTH_TOKEN..."
supabase secrets set --project-ref=$PROJECT_REF TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN"

echo "   Setting TWILIO_PHONE_NUMBER..."
supabase secrets set --project-ref=$PROJECT_REF TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER"

if [[ -n "$TWILIO_MESSAGING_SERVICE_SID" ]]; then
    echo "   Setting TWILIO_MESSAGING_SERVICE_SID..."
    supabase secrets set --project-ref=$PROJECT_REF TWILIO_MESSAGING_SERVICE_SID="$TWILIO_MESSAGING_SERVICE_SID"
fi

echo ""
echo "✅ Secrets deployed successfully!"
echo ""
echo "🔄 The Edge Functions will restart automatically with the new secrets."
echo "   You can now test SMS and WhatsApp functionality in your application."
echo ""
echo "📋 Next steps:"
echo "   1. Update your local .env file with the same credentials"
echo "   2. Restart your development server: npm run dev"
echo "   3. Test the configuration using the SMS/WhatsApp test components"
echo ""
echo "🚨 Important: Never commit your .env file with real credentials to version control!"