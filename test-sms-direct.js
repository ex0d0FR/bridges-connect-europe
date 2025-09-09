#!/usr/bin/env node

/**
 * Direct SMS Test Script
 * Tests the SMS configuration by calling the Supabase Edge Function directly
 */

const SUPABASE_URL = 'https://ovoldtknfdyvyypadnmf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92b2xkdGtuZmR5dnl5cGFkbm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzc5NDUsImV4cCI6MjA2ODcxMzk0NX0.9uwPMIYk88gx_NcKp91QxF7xS44E7q4UDJwRgoYspk0';

async function testSMSConfig() {
  console.log('🧪 Testing SMS Configuration...\n');
  
  // Get test phone number from user
  const readline = (await import('readline')).createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (query) => new Promise(resolve => readline.question(query, resolve));
  
  const testPhone = await askQuestion('📱 Enter a phone number to test (e.g., +1234567890): ');
  readline.close();
  
  if (!testPhone.trim()) {
    console.log('❌ No phone number provided');
    return;
  }
  
  try {
    console.log(`📞 Testing SMS to: ${testPhone}`);
    console.log('🔄 Calling SMS config test function...\n');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sms-config-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      },
      body: JSON.stringify({
        phoneNumber: testPhone.trim()
      })
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📄 Raw Response: ${responseText}\n`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('❌ Failed to parse response as JSON');
      return;
    }
    
    if (data.success) {
      console.log('✅ SMS Test Successful!');
      console.log(`📧 Message ID: ${data.testResults?.messageId}`);
      console.log(`📱 Recipient: ${data.testResults?.recipient}`);
      console.log(`📞 Sender: ${data.testResults?.sender}`);
      console.log(`📊 Status: ${data.testResults?.status}`);
    } else {
      console.log('❌ SMS Test Failed:');
      console.log(`   Error: ${data.error}`);
      
      if (data.errorCode) {
        console.log(`   Error Code: ${data.errorCode}`);
      }
      
      if (data.quickFix) {
        console.log(`   Quick Fix: ${data.quickFix}`);
      }
      
      if (data.solutions && data.solutions.length > 0) {
        console.log('   Solutions:');
        data.solutions.forEach((solution, i) => {
          console.log(`     ${i + 1}. ${solution}`);
        });
      }
      
      if (data.configCheck) {
        console.log('\n📋 Configuration Status:');
        console.log(`   Twilio Credentials: ${data.configCheck.twilioCredentials ? '✅' : '❌'}`);
        console.log(`   Twilio Sender: ${data.configCheck.twilioSender ? '✅' : '❌'}`);
        console.log(`   Messaging Service: ${data.configCheck.messagingServiceConfigured ? '✅' : '❌'}`);
        console.log(`   Phone Number: ${data.configCheck.phoneNumberConfigured ? '✅' : '❌'}`);
      }
      
      if (data.diagnostics) {
        console.log('\n🔍 Diagnostics:');
        console.log(`   Phone Number: ${data.diagnostics.phoneNumber}`);
        console.log(`   Phone Type: ${data.diagnostics.phoneNumberType}`);
        console.log(`   Credentials Type: ${data.diagnostics.credentialType}`);
        console.log(`   Is Sandbox: ${data.diagnostics.isSandboxNumber ? 'Yes' : 'No'}`);
        console.log(`   Has Live Credentials: ${data.diagnostics.hasLiveCredentials ? 'Yes' : 'No'}`);
        
        if (data.diagnostics.recommendedAction) {
          console.log(`   Recommended Action: ${data.diagnostics.recommendedAction}`);
        }
      }
      
      if (data.twilioError) {
        console.log('\n🔧 Twilio API Response:');
        console.log(`   Code: ${data.twilioError.code}`);
        console.log(`   Message: ${data.twilioError.message}`);
        console.log(`   More Info: ${data.twilioError.more_info || 'N/A'}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   • Make sure your development server is running');
    console.log('   • Check your internet connection');
    console.log('   • Verify Supabase project is accessible');
    console.log('   • Check browser console for CORS errors');
  }
}

// Self-executing async function
(async () => {
  try {
    await testSMSConfig();
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
})();