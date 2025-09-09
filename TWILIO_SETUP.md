# Twilio Configuration Guide

This guide will help you set up Twilio for SMS and WhatsApp messaging in your Bridges Connect Europe application.

## Prerequisites

1. A Twilio account ([Sign up here](https://www.twilio.com/try-twilio))
2. Access to your Twilio Console Dashboard

## Step 1: Get Your Twilio Credentials

### Account SID and Auth Token
1. Log in to your [Twilio Console](https://console.twilio.com/)
2. On the dashboard, find your **Account SID** and **Auth Token**
3. Copy these values - you'll need them for environment variables

### Phone Number Setup
1. Go to **Phone Numbers > Manage > Verified Caller IDs** (for trial accounts)
2. Or **Phone Numbers > Buy a Number** (for paid accounts)
3. Choose a phone number that supports SMS
4. Note: Trial accounts can only send to verified phone numbers

## Step 2: Environment Variables Setup

### For Local Development
Add these variables to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Optional: Messaging Service (recommended for production)
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
```

### For Supabase Edge Functions
These need to be set in your Supabase project:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Settings > Edge Functions**
3. Add the following secrets:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid (optional)
```

## Step 3: SMS Configuration

### Trial Account Limitations
- Can only send to verified phone numbers
- Messages include "Sent from your Twilio trial account" prefix
- Limited to 500 SMS messages

### Production Account
- Can send to any valid phone number
- No trial limitations
- Pay-per-message pricing

## Step 4: WhatsApp Configuration

### WhatsApp Sandbox (Testing)
1. In Twilio Console, go to **Messaging > WhatsApp > Sandbox**
2. Follow instructions to join your sandbox
3. Send "join [your-sandbox-keyword]" to the WhatsApp number provided
4. Use the sandbox number as your `TWILIO_PHONE_NUMBER`

### WhatsApp Business API (Production)
1. Apply for WhatsApp Business API access in Twilio Console
2. Complete business verification process
3. Purchase a dedicated WhatsApp Business number
4. Configure webhook endpoints (if needed)

## Step 5: Testing Your Configuration

### Using the Application
1. Start your application: `npm run dev`
2. Navigate to Settings page
3. Use the "SMS Configuration Test" or "WhatsApp Configuration Test" components
4. Enter a test phone number and send a test message

### Manual Testing
You can test your Twilio configuration directly using their API:

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
--data-urlencode "From=$TWILIO_PHONE_NUMBER" \
--data-urlencode "Body=Test message" \
--data-urlencode "To=+1234567890" \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

## Common Issues and Solutions

### Error: "Phone number is not a valid Twilio phone number"
- **Cause**: Using a sandbox number with live credentials
- **Solution**: Either use test credentials or purchase a real phone number

### Error: "Permission denied"
- **Cause**: Phone number doesn't have SMS capabilities
- **Solution**: Check phone number capabilities in Twilio Console

### Error: "Authentication failed"
- **Cause**: Incorrect Account SID or Auth Token
- **Solution**: Verify credentials in Twilio Console

### Error: "Phone number not found in account"
- **Cause**: Phone number not owned by your Twilio account
- **Solution**: Purchase the number or use a number you own

## Security Best Practices

1. **Never commit credentials to git**
   - Use environment variables only
   - Add `.env` to your `.gitignore`

2. **Use Messaging Services for production**
   - Better delivery rates
   - Automatic failover
   - Compliance features

3. **Implement rate limiting**
   - Prevent abuse
   - Control costs
   - The application includes built-in rate limiting

4. **Monitor usage and costs**
   - Set up billing alerts in Twilio
   - Monitor message logs
   - Track delivery rates

## Environment Variable Template

```env
# Copy this template and fill in your actual values

# === TWILIO CONFIGURATION ===
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Optional: For better delivery rates and features
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === SUPABASE CONFIGURATION (already configured) ===
VITE_SUPABASE_PROJECT_ID=ovoldtknfdyvyypadnmf
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://ovoldtknfdyvyypadnmf.supabase.co
```

## Next Steps

1. Set up your Twilio account and get credentials
2. Add environment variables (both locally and in Supabase)
3. Test the configuration using the built-in test components
4. Configure WhatsApp if needed
5. Start sending messages through your campaigns!

## Support

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Support](https://support.twilio.com/)
- Check the application's test components for diagnostics