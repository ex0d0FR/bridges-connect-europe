#!/usr/bin/env node

/**
 * Check Twilio Secrets Configuration
 * This helps identify issues with the Twilio configuration
 */

console.log('🔍 Checking Twilio Configuration in Supabase...\n');

// Test the sms-config-test function without sending SMS - just check configuration
const SUPABASE_URL = 'https://ovoldtknfdyvyypadnmf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';

async function checkConfig() {
  try {
    console.log('📡 Testing Edge Function accessibility...');
    
    // Test with an invalid phone number to trigger config check without sending SMS
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sms-config-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        phoneNumber: '' // Empty to trigger validation error
      })
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    const data = await response.text();
    console.log('📄 Response Data:');
    console.log(data);
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.configCheck) {
        console.log('\n🔧 Configuration Check Results:');
        console.log(`   Twilio Credentials: ${parsed.configCheck.twilioCredentials ? '✅ Present' : '❌ Missing'}`);
        console.log(`   Twilio Sender: ${parsed.configCheck.twilioSender ? '✅ Present' : '❌ Missing'}`);
        console.log(`   Messaging Service: ${parsed.configCheck.messagingServiceConfigured ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`   Phone Number: ${parsed.configCheck.phoneNumberConfigured ? '✅ Configured' : '❌ Not configured'}`);
      }
      
      if (parsed.error && parsed.error.includes('credentials')) {
        console.log('\n❌ CREDENTIAL ISSUE DETECTED:');
        console.log('   Your Twilio credentials may be incorrectly formatted or invalid');
        console.log('   Please verify in your Twilio Console:');
        console.log('   • Account SID starts with "AC" and is 34 characters');
        console.log('   • Auth Token is properly copied without extra spaces');
        console.log('   • Phone Number is in E.164 format (+1234567890)');
      }
      
    } catch (parseError) {
      console.log('❌ Could not parse JSON response');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔧 Possible causes:');
      console.log('   • Edge Function is not deployed or accessible');
      console.log('   • Network connectivity issues');
      console.log('   • CORS policy blocking the request');
    }
  }
}

checkConfig().catch(console.error);