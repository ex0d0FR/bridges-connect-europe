#!/usr/bin/env node

/**
 * Twilio Configuration Diagnostic Tool
 * This script helps diagnose Twilio SMS configuration issues
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Twilio Configuration Diagnostic Tool\n');

// Check local environment variables
console.log('📋 Local Environment Variables:');
const localTwilioVars = {
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
  'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER,
  'TWILIO_MESSAGING_SERVICE_SID': process.env.TWILIO_MESSAGING_SERVICE_SID
};

for (const [key, value] of Object.entries(localTwilioVars)) {
  const status = value ? '✅ Set' : '❌ Missing';
  const preview = value ? (key.includes('TOKEN') ? '***hidden***' : value) : 'Not set';
  console.log(`   ${key}: ${status} (${preview})`);
}

// Check .env file
console.log('\n📄 .env File Check:');
try {
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env', 'utf8');
  
  const hasAccountSid = envContent.includes('TWILIO_ACCOUNT_SID=') && !envContent.includes('TWILIO_ACCOUNT_SID=\n');
  const hasAuthToken = envContent.includes('TWILIO_AUTH_TOKEN=') && !envContent.includes('TWILIO_AUTH_TOKEN=\n');
  const hasPhoneNumber = envContent.includes('TWILIO_PHONE_NUMBER=') && !envContent.includes('TWILIO_PHONE_NUMBER=\n');
  
  console.log(`   Account SID in .env: ${hasAccountSid ? '✅' : '❌'}`);
  console.log(`   Auth Token in .env: ${hasAuthToken ? '✅' : '❌'}`);
  console.log(`   Phone Number in .env: ${hasPhoneNumber ? '✅' : '❌'}`);
  
  if (!hasAccountSid || !hasAuthToken || !hasPhoneNumber) {
    console.log('\n⚠️  Missing Twilio credentials in .env file');
    console.log('   Please add your Twilio credentials to the .env file:');
    console.log('   TWILIO_ACCOUNT_SID=your_account_sid_here');
    console.log('   TWILIO_AUTH_TOKEN=your_auth_token_here');
    console.log('   TWILIO_PHONE_NUMBER=+1234567890');
  }
} catch (error) {
  console.log('   ❌ Could not read .env file:', error.message);
}

// Test Supabase connection
console.log('\n🔗 Supabase Connection Test:');
try {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ovoldtknfdyvyypadnmf.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';
  
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('   ✅ Supabase client created successfully');
} catch (error) {
  console.log('   ❌ Supabase connection failed:', error.message);
}

// Provide next steps
console.log('\n🚀 Next Steps to Fix SMS Issues:');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.log('\n1️⃣ Configure Local Environment:');
  console.log('   • Add your Twilio credentials to the .env file');
  console.log('   • Get credentials from: https://console.twilio.com/');
  console.log('   • Format: TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx');
  console.log('   • Format: TWILIO_AUTH_TOKEN=your_auth_token');
  console.log('   • Format: TWILIO_PHONE_NUMBER=+1234567890');
}

console.log('\n2️⃣ Configure Supabase Edge Functions:');
console.log('   • Run: ./deploy-supabase-secrets.sh');
console.log('   • Or manually add secrets in Supabase Dashboard');
console.log('   • Navigate to: Settings → Edge Functions → Secrets');

console.log('\n3️⃣ Verify Twilio Account:');
console.log('   • Check your Twilio Console: https://console.twilio.com/');
console.log('   • Verify your phone number has SMS capabilities');
console.log('   • Check account balance (for paid accounts)');
console.log('   • Verify phone numbers (for trial accounts)');

console.log('\n4️⃣ Test Configuration:');
console.log('   • Restart your dev server: npm run dev');
console.log('   • Use the SMS Configuration Test in Settings');
console.log('   • Check browser console for detailed errors');

console.log('\n📞 Common Twilio Issues:');
console.log('   • Trial accounts can only send to verified numbers');
console.log('   • Sandbox numbers need to be joined via WhatsApp/SMS');
console.log('   • Phone numbers need SMS capabilities enabled');
console.log('   • Check for typos in Account SID and Auth Token');

console.log('\n💡 Quick Test:');
console.log('   You can test your credentials directly at:');
console.log('   https://www.twilio.com/console/sms/getting-started/build-your-first-app');